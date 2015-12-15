interface String {
    repeat(count:number): string;
}

interface HTMLElement {
    createTextRange(): TextRange;
}

interface Document {
    selection: any;
}

//From filesaver.min.js
declare function saveAs(data:Blob, filename:string, disableAutoBOM?:boolean);