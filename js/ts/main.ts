///<reference path="dexformat.ts"/>
///<reference path="defs/jquery.d.ts"/>
///<reference path="defs/bootstrap.d.ts"/>
///<reference path="defs/various.d.ts"/>
///<reference path="model.ts"/>

import ClassDef = DexFormat.ClassDef;
import TypeDef = DexFormat.TypeDef;
import DexFileReader = DexFormat.DexFileReader;

namespace ApkMethodCount {

    export class AppView {

        //Used for saving classes and method counts in package tree
        public static TREE_META_NODE:string = "__metadata";

        private static PLUS_SIGN_GLYPHICON:string = "glyphicon-plus-sign";
        private static MINUS_SIGN_GLYPHICON:string = "glyphicon-minus-sign";

        private static TEXT_EXPAND:string = "Expand";
        private static TEXT_COLLAPSE:string = "Collapse";

        private generatedTreePlain:string[] = [];
        private lastFilename:string = "classes_stats";
        private treeView:JQuery = $("#package-tree");
        private lastMouseOverNode:JQuery = null;
        private nodeTraverse:string[] = [];

        private model:Model = new Model();

        private fileReaderOpts:FileReaderJSOpts = {
            readAsDefault: "ArrayBuffer", on: {
                load: (e, v) => this.onLoadFile(e, v)
            }
        };

        constructor() {
            //Check If browser supports FileReader API
            if (typeof FileReader === "undefined") {
                $('#dropzone, #dropzone-dialog').hide();
                $('#compat-error').show();
            } else {
                $('#dropzone, #dropzone-dialog').fileReaderJS(this.fileReaderOpts);
            }

            //Bind event listeners
            this.treeView.on("mouseleave", ()=> this.resetLastMouseOverNode());
            $("#expand-collapse-btn").on("click", ()=> this.expandCollapseAll());
            $("#download-btn").on("click", ()=> this.download());
            $("#dropzone").on("click", ()=> this.dropzoneClick());
        }

        private onLoadFile(e:any, file:File):void {
            this.lastFilename = this.model.extractFileNameWithoutExt(file.name);
            this.setIsLoading(true);
            setTimeout(() => {
                var errorText = $(".alert-danger.box");
                try {
                    var data = this.model.loadDexFile(e.target.result);
                    this.renderPackages(data);
                    $("#output-box").fadeIn();
                    $(".nouploadinfo").hide();
                    $("#dropzone").delay(50).animate({height: 50}, 500);
                    $("#success-box").show();
                    errorText.hide();
                } catch (exception) {
                    console.log(exception);
                    this.setIsLoading(false);
                    errorText.text("Not a valid APK!");
                    errorText.show();
                    $("#output-box").hide();
                    $("#success-box").hide();
                }
            }, 50);
        }

        private setIsLoading(isLoading:boolean):void {
            var dropText = $("#drop-text");
            var loading = $("#drop-loading");
            if (isLoading) {
                dropText.hide();
                loading.show();
            } else {
                dropText.show();
                loading.hide();
            }
        }

        private renderPackages(data:LoadedDexData):void {
            var treeBuilder = [];

            this.generatedTreePlain = [];
            this.generatedTreePlain.push("Total methods count: " + data.methodsCount);
            this.generatedTreePlain.push("");

            treeBuilder.push("<ul>");
            this.recursiveRenderPackage(treeBuilder, data.tree, 0);
            treeBuilder.push("</ul>");

            this.treeView.empty();
            this.treeView.append(treeBuilder.join(""));
            this.updateTree();

            $("#method-count-multidex").text(data.multidex ? "(multidex enabled)" : "");
            $("#method-count-total").text(data.methodsCount);
            $(".show-class-detail").on("click", (e)=> {
                this.showPackageDetail($(e.currentTarget).data("package"));
            });

            this.setIsLoading(false);
        }

        private recursiveRenderPackage(treeBuilder:string[], node:any, level:number):void {
            //Sort current node by method counts
            var sortedNode = Object.keys(node).sort((a:any, b:any) => {
                if (a == AppView.TREE_META_NODE || b == AppView.TREE_META_NODE) return -1;
                return node[b][AppView.TREE_META_NODE].getCount() - node[a][AppView.TREE_META_NODE].getCount();
            });
            for (var item in sortedNode) {
                item = sortedNode[item];
                if (item != AppView.TREE_META_NODE) {
                    var displayStyle = level <= Model.START_LEVEL_VISIBLE ? "visible" : "none";
                    var nodeSign = "<i class='glyphicon " + (level == 0 ? AppView.MINUS_SIGN_GLYPHICON : AppView.PLUS_SIGN_GLYPHICON) + "'></i> ";
                    var hasChildren = Object.keys(node[item]).length > 1; //TREE_META_NODE ignore
                    var count = node[item][AppView.TREE_META_NODE].getCount();
                    var extraSpan = "";
                    var extraInfo = "";

                    if (level > 0) {
                        extraSpan = this.nodeTraverse.join(".") + "." + item;
                        extraInfo = "<p class='node-info extra-info'>" +
                            "<a title='Search using Google' href='https://www.google.com/search?q=\"" + extraSpan + "\"' target='_blank'>" +
                            "<i class='glyphicon glyphicon-search' aria-hidden='true'></i></a>" +
                            "<a title='Show classes' href='javascript:void(0)' class='show-class-detail' data-package='" + extraSpan + "'>" +
                            "<i class='glyphicon glyphicon glyphicon-signal' aria-hidden='true'></i></a></p>";
                    }

                    this.generatedTreePlain.push("\t".repeat(level) + item + " [" + count + "]");

                    treeBuilder.push("<li style='display: " + displayStyle + "'><span> " + (hasChildren ? nodeSign : "") + item +
                        " <span class='badge'>" + count + "</span></span> <p class='node-info'>" + extraSpan + "</p>" + extraInfo);
                    if (hasChildren) {
                        this.nodeTraverse.push(item);
                        treeBuilder.push("<ul>");
                        level++;
                        this.recursiveRenderPackage(treeBuilder, node[item], level);
                        level--;
                        treeBuilder.push("</ul>");
                        this.nodeTraverse.pop();
                    }
                    treeBuilder.push("</li>");
                }
            }
        }

        private showPackageDetail(packagePath:string):void {
            var packageNameParts = packagePath.split(".");
            var currentNode = null;

            //Get classes for package
            var currentTreeMap = this.model.getCurrentTreemap();
            for (var i = 0; i < packageNameParts.length; i++) {
                if (currentNode == null) {
                    currentNode = currentTreeMap[packageNameParts[i]];
                } else {
                    currentNode = currentNode[packageNameParts[i]];
                }
            }

            var tableBody = $(".modal-body table tbody");
            tableBody.empty();

            //Sort by counts
            var classes = [];
            var sortedNode = currentNode[AppView.TREE_META_NODE].getSortedClasses();
            for (var item in sortedNode) {
                var data = currentNode[AppView.TREE_META_NODE].getClassWrapper(Number(sortedNode[item]));
                var count = data.getMethodCount();
                var classNameFull = data.getClassType().getDescriptor();
                var className = DexFileReader.getClassNameOnly(classNameFull);
                var classNameFullReadable = DexFileReader.descriptorToDot(classNameFull);

                var typename = this.model.formatType(className, data);
                var typeIcon = "<img src='img/types/" + typename + ".png' title='" + typename + "'/>&nbsp;";

                classes.push("<tr><td>" + typeIcon + "<span title='" + classNameFullReadable + "'>"
                    + this.formatInnerClasses(className) + "</span></td><td>" + count + "</td></tr>");
            }

            $(".modal-body").animate({scrollTop: 0}, "fast");
            tableBody.html(classes.join(""));

            $("#package-detail .modal-title").html("Classes of <i>" + packagePath + "</i>");
            $("#package-detail").modal();
        }

        private formatInnerClasses(name:string):string {
            var split = name.split("$");
            var formatted = "";
            for (var i = 0; i < split.length; i++) {
                if (i == split.length - 1) {
                    if (this.model.isInnerClassFromName(split[i])) { //check for anonymous classes
                        formatted += "<span class='class-last-part'><i>(anon-cls-" + split[i] + ")</i></span>";
                    } else {
                        formatted += "<span class='class-last-part'>" + split[i] + "</span>";
                    }
                } else {
                    formatted += "<span class='class-part'>" + split[i] + "$</span>";
                }
            }
            return formatted;
        }

        private resetLastMouseOverNode():void {
            if (this.lastMouseOverNode != null) {
                this.lastMouseOverNode.css("display", "none");
                this.lastMouseOverNode = null;
            }
        }

        private updateTree():void {
            $('.tree li:has(ul)').addClass('parent_li').find(' > span');

            $('.tree li.parent_li > span').on('click', function (e) {
                var children = $(this).parent('li.parent_li').find(' > ul > li');
                if (children.is(":visible")) {
                    children.hide('fast');
                    $(this).find(' > i').addClass(AppView.PLUS_SIGN_GLYPHICON).removeClass(AppView.MINUS_SIGN_GLYPHICON);
                } else {
                    children.show('fast');
                    $(this).find(' > i').addClass(AppView.MINUS_SIGN_GLYPHICON).removeClass(AppView.PLUS_SIGN_GLYPHICON);
                }
                e.stopPropagation();
            });

            $('.tree li > span').on('mouseenter', (e) => {
                this.resetLastMouseOverNode();
                var nodeInfo = $(e.target).closest("li").find(".node-info"); //:first
                nodeInfo.css("display", "inline-block");
                this.lastMouseOverNode = nodeInfo;
                e.stopPropagation();
            });

            $(".node-info").on("click", (e) => {
                this.selectAll($(e.target)[0]);
                e.stopPropagation();
            });
        }

        private selectAll(el:HTMLElement):void {
            if (typeof window.getSelection != "undefined" && typeof document.createRange != "undefined") {
                var range = document.createRange();
                range.selectNodeContents(el);
                var sel = window.getSelection();
                sel.removeAllRanges();
                sel.addRange(range);
            } else if (typeof document.selection != "undefined" && typeof document.body.createTextRange != "undefined") {
                var textRange = document.body.createTextRange();
                textRange.moveToElementText(el);
                textRange.select();
            }
        }

        private dropzoneClick():void {
            $("#dropzone-dialog").click();
        }

        private expandCollapseAll():void {
            var allChildrenSelector = $('.tree ul > li > ul');

            var btn = $("#expand-collapse-btn");
            if (btn.text() == AppView.TEXT_COLLAPSE) {
                allChildrenSelector.find("li").hide();
                btn.text(AppView.TEXT_EXPAND);
                var s = $("." + AppView.MINUS_SIGN_GLYPHICON);

                s.removeClass(AppView.MINUS_SIGN_GLYPHICON);
                s.addClass(AppView.PLUS_SIGN_GLYPHICON);
            } else {
                allChildrenSelector.find("li").show();
                btn.text(AppView.TEXT_COLLAPSE);
                var s = $("." + AppView.PLUS_SIGN_GLYPHICON);

                s.removeClass(AppView.PLUS_SIGN_GLYPHICON);
                s.addClass(AppView.MINUS_SIGN_GLYPHICON);
            }
        }

        private download():void {
            var blob = new Blob([this.generatedTreePlain.join("\n")], {type: "text/plain;charset=utf-8"});
            saveAs(blob, this.lastFilename + ".txt");
        }

    }

    String.prototype.repeat = function (num) {
        return new Array(num + 1).join(this);
    };
}
new ApkMethodCount.AppView();
