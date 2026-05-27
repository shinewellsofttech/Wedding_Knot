using System;
using System.Collections.Generic;
using System.Drawing.Printing;
using System.IO;
using System.Net;
using System.Runtime.InteropServices;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace LocalPrintAgent
{
    class Program
    {
        private const string Address = "http://127.0.0.1:9187/";

        static async Task Main(string[] args)
        {
            Console.WriteLine("====================================================");
            Console.WriteLine("      Wedding Knot Local Barcode Print Agent        ");
            Console.WriteLine("====================================================");
            Console.WriteLine($"Starting local agent server at: {Address}");
            Console.WriteLine("Keep this window open to print directly from the browser.");
            Console.WriteLine("Press Ctrl+C to close.");
            Console.WriteLine("====================================================\n");

            using var listener = new HttpListener();
            listener.Prefixes.Add(Address);

            try
            {
                listener.Start();
                Console.ForegroundColor = ConsoleColor.Green;
                Console.WriteLine($"[{DateTime.Now:HH:mm:ss}] Agent started successfully. Waiting for requests...");
                Console.ResetColor();
            }
            catch (Exception ex)
            {
                Console.ForegroundColor = ConsoleColor.Red;
                Console.WriteLine($"Error starting server: {ex.Message}");
                Console.WriteLine("Make sure port 9187 is not already in use by another application.");
                Console.ResetColor();
                Console.ReadLine();
                return;
            }

            while (listener.IsListening)
            {
                try
                {
                    var context = await listener.GetContextAsync();
                    _ = Task.Run(() => HandleRequestAsync(context));
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error dispatching connection: {ex.Message}");
                }
            }
        }

        private static async Task HandleRequestAsync(HttpListenerContext context)
        {
            var request = context.Request;
            using var response = context.Response;

            // Enable CORS headers so public HTTPS deployed sites can query the local agent
            response.Headers.Add("Access-Control-Allow-Origin", "*");
            response.Headers.Add("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
            response.Headers.Add("Access-Control-Allow-Headers", "Content-Type");

            // Handle preflight requests
            if (request.HttpMethod == "OPTIONS")
            {
                response.StatusCode = (int)HttpStatusCode.OK;
                response.Close();
                return;
            }

            try
            {
                // ── GET /ping ──────────────────────────────────────────────
                if (request.Url?.AbsolutePath == "/ping" && request.HttpMethod == "GET")
                {
                    Console.WriteLine($"[{DateTime.Now:HH:mm:ss}] Ping request received");
                    await WriteJsonResponse(response, HttpStatusCode.OK,
                        "{\"status\":\"OK\",\"message\":\"Print Agent is active\"}");
                }

                // ── GET /printers ─────────────────────────────────────────
                else if (request.Url?.AbsolutePath == "/printers" && request.HttpMethod == "GET")
                {
                    Console.WriteLine($"[{DateTime.Now:HH:mm:ss}] Printer list requested");

                    var printers = new List<string>();
                    foreach (string printer in PrinterSettings.InstalledPrinters)
                    {
                        printers.Add(printer);
                    }

                    // Find the default printer
                    var defaultPrinterSettings = new PrinterSettings();
                    string defaultPrinter = defaultPrinterSettings.PrinterName;

                    Console.WriteLine($"[{DateTime.Now:HH:mm:ss}] Found {printers.Count} printer(s). Default: '{defaultPrinter}'");

                    var jsonObj = new
                    {
                        printers,
                        defaultPrinter
                    };
                    string json = JsonSerializer.Serialize(jsonObj);
                    await WriteJsonResponse(response, HttpStatusCode.OK, json);
                }

                // ── GET /printer-info?name=<printerName> ─────────────────
                else if (request.Url?.AbsolutePath == "/printer-info" && request.HttpMethod == "GET")
                {
                    string printerNameParam = GetQueryParam(request.Url, "name");
                    if (string.IsNullOrWhiteSpace(printerNameParam))
                    {
                        await WriteJsonResponse(response, HttpStatusCode.BadRequest,
                            "{\"error\":\"Query param 'name' is required.\"}");
                        return;
                    }

                    Console.WriteLine($"[{DateTime.Now:HH:mm:ss}] Printer info requested for: '{printerNameParam}'");

                    try
                    {
                        var ps = new PrinterSettings { PrinterName = printerNameParam };

                        if (!ps.IsValid)
                        {
                            await WriteJsonResponse(response, HttpStatusCode.NotFound,
                                $"{{\"error\":\"Printer '{printerNameParam}' not found or not valid.\"}}");
                            return;
                        }

                        // ── Paper Sizes ─────────────────────────────────────
                        var paperSizes = new List<Dictionary<string, object>>();
                        foreach (PaperSize size in ps.PaperSizes)
                        {
                            double wMm = Math.Round(size.Width  * 25.4 / 100.0, 1);
                            double hMm = Math.Round(size.Height * 25.4 / 100.0, 1);
                            if (wMm <= 0 || hMm <= 0) continue; // skip invalid
                            paperSizes.Add(new Dictionary<string, object>
                            {
                                ["name"]     = size.PaperName,
                                ["widthMm"]  = wMm,
                                ["heightMm"] = hMm,
                                ["widthIn"]  = Math.Round(size.Width  / 100.0, 2),
                                ["heightIn"] = Math.Round(size.Height / 100.0, 2),
                                ["kind"]     = (int)size.Kind
                            });
                        }

                        // ── Resolutions ─────────────────────────────────────
                        var resolutions = new List<int>();
                        foreach (PrinterResolution res in ps.PrinterResolutions)
                        {
                            if (res.X > 0 && !resolutions.Contains(res.X))
                                resolutions.Add(res.X);
                        }
                        resolutions.Sort();
                        if (resolutions.Count == 0) resolutions.Add(203); // fallback

                        // ── Defaults ─────────────────────────────────────────
                        var defPage   = ps.DefaultPageSettings;
                        int defDpi    = defPage.PrinterResolution?.X ?? 203;
                        if (defDpi <= 0) defDpi = 203;

                        double defWmm = Math.Round(defPage.PaperSize.Width  * 25.4 / 100.0, 1);
                        double defHmm = Math.Round(defPage.PaperSize.Height * 25.4 / 100.0, 1);

                        var result = new Dictionary<string, object>
                        {
                            ["paperSizes"]       = paperSizes,
                            ["resolutions"]      = resolutions,
                            ["defaultPaperName"] = defPage.PaperSize.PaperName,
                            ["defaultWidthMm"]   = defWmm,
                            ["defaultHeightMm"]  = defHmm,
                            ["defaultDpi"]       = defDpi,
                            ["isLandscape"]      = defPage.Landscape
                        };

                        string infoJson = JsonSerializer.Serialize(result);
                        Console.WriteLine($"[{DateTime.Now:HH:mm:ss}] Returned {paperSizes.Count} paper sizes, resolutions: [{string.Join(",", resolutions)}], defaultDpi: {defDpi}");
                        await WriteJsonResponse(response, HttpStatusCode.OK, infoJson);
                    }
                    catch (Exception ex)
                    {
                        Console.ForegroundColor = ConsoleColor.Red;
                        Console.WriteLine($"[{DateTime.Now:HH:mm:ss}] Printer info error: {ex.Message}");
                        Console.ResetColor();
                        await WriteJsonResponse(response, HttpStatusCode.InternalServerError,
                            $"{{\"error\":\"{JsonEncodedText.Encode(ex.Message)}\"}}");
                    }
                }

                // ── POST /print ───────────────────────────────────────────
                else if (request.Url?.AbsolutePath == "/print" && request.HttpMethod == "POST")
                {
                    // Always read as UTF-8 (JSON is UTF-8 by default)
                    using var reader = new StreamReader(request.InputStream, Encoding.UTF8);
                    string body = await reader.ReadToEndAsync();

                    Console.WriteLine($"[{DateTime.Now:HH:mm:ss}] Print POST received. Body length: {body.Length} chars");
                    Console.WriteLine($"[{DateTime.Now:HH:mm:ss}] Full TSPL Payload:\n{body}\n----------------------------------");

                    PrintPayload? payload = null;
                    try
                    {
                        payload = JsonSerializer.Deserialize<PrintPayload>(body, new JsonSerializerOptions
                        {
                            PropertyNameCaseInsensitive = true
                        });
                    }
                    catch (Exception parseEx)
                    {
                        Console.ForegroundColor = ConsoleColor.Red;
                        Console.WriteLine($"[{DateTime.Now:HH:mm:ss}] JSON parse error: {parseEx.Message}");
                        Console.ResetColor();
                        await WriteJsonResponse(response, HttpStatusCode.BadRequest,
                            $"{{\"error\":\"JSON parse error: {JsonEncodedText.Encode(parseEx.Message)}\"}}");
                        return;
                    }

                    if (payload == null || string.IsNullOrWhiteSpace(payload.Tspl) || string.IsNullOrWhiteSpace(payload.PrinterName))
                    {
                        Console.ForegroundColor = ConsoleColor.Yellow;
                        Console.WriteLine($"[{DateTime.Now:HH:mm:ss}] Payload validation failed:");
                        Console.WriteLine($"   payload null?      : {payload == null}");
                        Console.WriteLine($"   tspl null/empty?   : {string.IsNullOrWhiteSpace(payload?.Tspl)}");
                        Console.WriteLine($"   printer null/empty?: {string.IsNullOrWhiteSpace(payload?.PrinterName)}");
                        Console.ResetColor();

                        await WriteJsonResponse(response, HttpStatusCode.BadRequest,
                            "{\"error\":\"Invalid payload. 'tspl' and 'printerName' are required.\"}");
                        return;
                    }

                    Console.WriteLine($"[{DateTime.Now:HH:mm:ss}] Received print request for printer: '{payload.PrinterName}'");
                    Console.WriteLine($"[{DateTime.Now:HH:mm:ss}] TSPL length: {payload.Tspl.Length} chars");

                    bool success = RawPrinterHelper.SendStringToPrinter(payload.PrinterName, payload.Tspl, out string error);

                    if (success)
                    {
                        Console.ForegroundColor = ConsoleColor.Green;
                        Console.WriteLine($"[{DateTime.Now:HH:mm:ss}] Labels spooled to printer successfully.");
                        Console.ResetColor();
                        await WriteJsonResponse(response, HttpStatusCode.OK, "{\"success\":true}");
                    }
                    else
                    {
                        Console.ForegroundColor = ConsoleColor.Red;
                        Console.WriteLine($"[{DateTime.Now:HH:mm:ss}] Spooler Error: {error}");
                        Console.ResetColor();
                        await WriteJsonResponse(response, HttpStatusCode.InternalServerError,
                            $"{{\"success\":false,\"error\":\"{JsonEncodedText.Encode(error)}\"}}");
                    }
                }
                else
                {
                    response.StatusCode = (int)HttpStatusCode.NotFound;
                }
            }
            catch (Exception ex)
            {
                Console.ForegroundColor = ConsoleColor.Red;
                Console.WriteLine($"[{DateTime.Now:HH:mm:ss}] Internal Server Error: {ex.Message}");
                Console.ResetColor();
                await WriteJsonResponse(response, HttpStatusCode.InternalServerError,
                    $"{{\"error\":\"{JsonEncodedText.Encode(ex.Message)}\"}}");
            }
            finally
            {
                response.Close();
            }
        }

        private static async Task WriteJsonResponse(HttpListenerResponse response, HttpStatusCode statusCode, string json)
        {
            response.StatusCode = (int)statusCode;
            response.ContentType = "application/json";
            byte[] data = Encoding.UTF8.GetBytes(json);
            response.ContentLength64 = data.Length;
            await response.OutputStream.WriteAsync(data, 0, data.Length);
        }

        private static string GetQueryParam(Uri? uri, string key)
        {
            if (uri == null) return string.Empty;
            var query = uri.Query.TrimStart('?');
            foreach (var part in query.Split('&'))
            {
                var kv = part.Split('=', 2);
                if (kv.Length == 2 && Uri.UnescapeDataString(kv[0]) == key)
                    return Uri.UnescapeDataString(kv[1]);
            }
            return string.Empty;
        }
    }

    public class PrintPayload
    {
        [JsonPropertyName("tspl")]
        public string Tspl { get; set; } = string.Empty;

        [JsonPropertyName("printerName")]
        public string PrinterName { get; set; } = string.Empty;
    }

    // Win32 Spooler Printing Helper Wrapper
    public static class RawPrinterHelper
    {
        [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Ansi)]
        public class DOCINFOA
        {
            [MarshalAs(UnmanagedType.LPStr)] public string pDocName = string.Empty;
            [MarshalAs(UnmanagedType.LPStr)] public string pOutputFile = null!;
            [MarshalAs(UnmanagedType.LPStr)] public string pDataType = string.Empty;
        }

        [DllImport("winspool.Drv", EntryPoint = "OpenPrinterA", SetLastError = true, CharSet = CharSet.Ansi, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
        public static extern bool OpenPrinter([MarshalAs(UnmanagedType.LPStr)] string szPrinter, out IntPtr hPrinter, IntPtr pd);

        [DllImport("winspool.Drv", EntryPoint = "ClosePrinter", SetLastError = true, CallingConvention = CallingConvention.StdCall)]
        public static extern bool ClosePrinter(IntPtr hPrinter);

        [DllImport("winspool.Drv", EntryPoint = "StartDocPrinterA", SetLastError = true, CharSet = CharSet.Ansi, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
        public static extern int StartDocPrinter(IntPtr hPrinter, int level, [In, MarshalAs(UnmanagedType.LPStruct)] DOCINFOA di);

        [DllImport("winspool.Drv", EntryPoint = "EndDocPrinter", SetLastError = true, CallingConvention = CallingConvention.StdCall)]
        public static extern bool EndDocPrinter(IntPtr hPrinter);

        [DllImport("winspool.Drv", EntryPoint = "StartPagePrinter", SetLastError = true, CallingConvention = CallingConvention.StdCall)]
        public static extern bool StartPagePrinter(IntPtr hPrinter);

        [DllImport("winspool.Drv", EntryPoint = "EndPagePrinter", SetLastError = true, CallingConvention = CallingConvention.StdCall)]
        public static extern bool EndPagePrinter(IntPtr hPrinter);

        [DllImport("winspool.Drv", EntryPoint = "WritePrinter", SetLastError = true, CallingConvention = CallingConvention.StdCall)]
        public static extern bool WritePrinter(IntPtr hPrinter, IntPtr pBytes, int dwCount, out int dwWritten);

        public static bool SendStringToPrinter(string szPrinterName, string szString, out string error)
        {
            error = string.Empty;
            IntPtr hPrinter;
            var di = new DOCINFOA
            {
                pDocName = "RAW Barcode Print",
                pDataType = "RAW"
            };

            if (!OpenPrinter(szPrinterName, out hPrinter, IntPtr.Zero))
            {
                int errCode = Marshal.GetLastWin32Error();
                error = $"Failed to open printer '{szPrinterName}'. Error code: {errCode}. Verify the printer name is correct.";
                return false;
            }

            try
            {
                if (StartDocPrinter(hPrinter, 1, di) == 0)
                {
                    int errCode = Marshal.GetLastWin32Error();
                    error = $"Failed to start document spooling. Error code: {errCode}";
                    return false;
                }

                try
                {
                    if (!StartPagePrinter(hPrinter))
                    {
                        int errCode = Marshal.GetLastWin32Error();
                        error = $"Failed to start page spooling. Error code: {errCode}";
                        return false;
                    }

                    try
                    {
                        // Normalize line endings for strict TSPL parsers
                        string normalizedStr = szString.Replace("\r\n", "\n").Replace("\n", "\r\n");
                        
                        // Use explicit Encoding to prevent Ansi/ASCII length mismatch
                        byte[] bytes = Encoding.Default.GetBytes(normalizedStr);
                        IntPtr pBytes = Marshal.AllocHGlobal(bytes.Length);
                        
                        try
                        {
                            Marshal.Copy(bytes, 0, pBytes, bytes.Length);
                            
                            if (!WritePrinter(hPrinter, pBytes, bytes.Length, out int dwWritten))
                            {
                                int errCode = Marshal.GetLastWin32Error();
                                error = $"Failed to write to printer spooler. Error code: {errCode}";
                                return false;
                            }
                            return true;
                        }
                        finally
                        {
                            Marshal.FreeHGlobal(pBytes);
                        }
                    }
                    finally
                    {
                        EndPagePrinter(hPrinter);
                    }
                }
                finally
                {
                    EndDocPrinter(hPrinter);
                }
            }
            finally
            {
                ClosePrinter(hPrinter);
            }
        }
    }
}
