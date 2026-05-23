export interface LanguageDataType{
    languageParameter:string,
    languageName:string,
    languageIconClassName:string,
    subTitle?:string
}

export interface ChangeLngType {
    data: string;
    logo: string;
    language: string;
  }

export interface LangState {
    i18LangStatus: string;
}

export interface profilesMessageType{
    name : string,
    icon : "User" | "Mail" |"FileText" |"Settings" | "LogOut" ,
    link : string
}