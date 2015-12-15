// Type definitions for jDataView
// Project: https://github.com/jDataView/jDataView
// Definitions by: Ingvar Stepanyan <https://github.com/RReverser>
// Definitions: https://github.com/borisyankov/DefinitelyTyped

declare interface ReaderEvents {
    progress?: (ev: any, file:File) => any;
    load?: (ev: any, file:File) => any;
    abort?: (ev: any, file:File) => any;
    error?: (ev: any, file:File) => any;
    loadend?: (ev: any, file:File) => any;
    skip?: (ev: any, file:File) => any;
    groupstart?: (ev: any, file:File) => any;
    groupend?: (ev: any, file:File) => any;
    beforestart?: (ev: any, file:File) => any;
}

declare interface FileReaderJSOpts {
    dragClass?: string;
    accept?: boolean;
    readAsDefault?: string;
    on?: ReaderEvents;
}

declare class FileReaderJS {
    static setupClipboard(element:HTMLElement, opts:FileReaderJSOpts);
    static setupDrop(element:HTMLElement, opts:FileReaderJSOpts);
    static setupInput(element:HTMLElement, opts:FileReaderJSOpts);
    static setSync(sync:boolean);
}

interface JQuery {
    fileReaderJS(opts: FileReaderJSOpts): JQuery;
}