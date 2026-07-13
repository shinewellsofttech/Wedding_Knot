const fs = require('fs');
const path = require('path');

const dir = 'd:/Office Work/Weddingr Knot/src/Pages/Masters';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Find the list variable
  let listMatch = content.match(/state\.([A-Za-z0-9]+List)/);
  if (!listMatch) {
     listMatch = content.match(/state\.([A-Za-z0-9]+Data)/);
  }
  let listName = listMatch ? listMatch[1] : null;

  if (!listName) {
      console.log('Could not find list in', file);
      return;
  }

  let modified = false;

  const regex1 = /const handleDelete = \(id:\s*number\s*\|\s*string\) => \{\s*if \(!id\) return;\s*if \(window\.confirm\("Are you sure you want to delete ([^"]+)"\)\) \{/;
  const regex2 = /const handleDelete = \(id:\s*number\s*\|\s*string\) => \{\s*if \(!id\) return;\s*(const itemToDelete = [^;]+;)\s*if \(window\.confirm\("Are you sure you want to delete ([^"]+)"\)\) \{/;
  const regex3 = /const handleDelete = \(id:\s*number\s*\|\s*string\) => \{\s*if \(!id\) return;\s*if \(window\.confirm\("Are you sure you want to delete ([^"]+)"\)\) \{\s*(const itemToDelete = [^;]+;)/;

  const getReplacement = (itemToDeleteLine) => {
      let code = `const handleDelete = (id: number | string) => {\n    if (!id) return;\n`;
      if (itemToDeleteLine) {
          code += `    ${itemToDeleteLine}\n`;
      } else {
          code += `    const itemToDelete = state.${listName}?.find((item: any) => String(item?.Id) === String(id));\n`;
      }
      code += `    const itemName = itemToDelete?.Name || itemToDelete?.ItemName || itemToDelete?.LedgerName || itemToDelete?.CompanyName || itemToDelete?.UserName || itemToDelete?.VoucherName || itemToDelete?.GroupName || itemToDelete?.AdminName || itemToDelete?.Title || itemToDelete?.RoleName || itemToDelete?.CityName || itemToDelete?.StateName || itemToDelete?.CountryName || itemToDelete?.MaterialName || "this item";\n`;
      code += `    if (window.confirm(\`Are you sure you want to delete '\${itemName}'?\`)) {`;
      return code;
  };

  if (regex3.test(content)) {
    content = content.replace(regex3, (match, what, itemToDeleteLine) => {
       return getReplacement(itemToDeleteLine);
    });
    modified = true;
  } else if (regex2.test(content)) {
    content = content.replace(regex2, (match, itemToDeleteLine, what) => {
       return getReplacement(itemToDeleteLine);
    });
    modified = true;
  } else if (regex1.test(content)) {
    content = content.replace(regex1, (match, what) => {
       return getReplacement(null);
    });
    modified = true;
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated', file);
  } else {
    console.log('Regex did not match in', file);
  }
});
