
var isOldIE = false;
if (!jQuery.browser.msie || (jQuery.browser.msie && parseInt(jQuery.browser.version.split('.')[0],10) >= 10 )) {
    Util.includejs_once("../js/html2canvas.js");
    Util.includejs_once("../js/base64.js");
    Util.includejs_once("../js/canvas2image.js");
    Util.includejs_once("../js/FileSaver.js");
    //Util.includejs_once("../js/canvas-toBlob.js");
    Util.includejs_once("../js/canvas-to-blob.js");
}
else {
    Util.includejs_once("../js/modernizr-latest.js");
    Util.includejs_once("../js/html5.js");
    Util.includejs_once("../js/excanvas.js");
    //Util.includejs_once("../js/canvas2image.js");
    Util.includejs_once("../js/FileSaver.js");
    Util.includejs_once("../js/canvas-to-blob.js");
    
    isOldIE = true;
}

isChrome = function () {
    return /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
}
isSafari = function () {
    return /Safari/.test(navigator.userAgent) && /Apple Computer/.test(navigator.vendor);
}

downloadIMG = function (strData, strFileName, strMimeType) {
    var D = document,
        A = arguments,
        a = D.createElement("a"),
        d = A[0],
        n = A[1],
        t = A[2] || "text/plain";
         
    //build download link:
    //a.href = "data:" + strMimeType + "," + escape(strData);
    a.href = strData;


    if (window.MSBlobBuilder) {
        var bb = new MSBlobBuilder();
        bb.append(strData);
        return navigator.msSaveBlob(bb, strFileName);
    } /* end if(window.MSBlobBuilder) */
    
    if ('download' in a) {
        a.setAttribute("download", n);
        a.innerHTML = "downloading...";
        D.body.appendChild(a);
        setTimeout(function () {
            var e = D.createEvent("MouseEvents");
            e.initMouseEvent("click", true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
            a.dispatchEvent(e);
            D.body.removeChild(a);
        }, 66);
        return true;
    } /* end if('download' in a) */
    ; //end if a[download]?
    
    
    
    //do iframe dataURL download:
    var f = D.createElement("iframe");
    D.body.appendChild(f);
    f.src = "data:" + (A[2] ? A[2] : "application/octet-stream") + (window.btoa ? ";base64" : "") + "," + (window.btoa ? window.btoa : escape)(strData);
    setTimeout(function () {
        D.body.removeChild(f);
    }, 333);
    return true;
}   /* end download() */


downloadImagem = function () {

    desabilitaControles(true);
    
    var divMap = $('#map'); //$('.olMapViewport>div') ;


    if (!jQuery.browser.msie && !isSafari()) { //Chrome, FireFox
        html2canvas(divMap, {
            logging: true,
            useCORS: true,
            onrendered: function (canvas) {
                //img = canvas.toDataURL('image/png');
                //Canvas2Image.saveAsPNG(canvas);
                img = Canvas2Image.saveAsJPEG(canvas, true);
                downloadIMG(img.src, "Mapa_" + (new Date()).getTime() + ".jpeg", 'image/jpeg');
                desabilitaControles(false);
            }
        });
    }
    else {
        if (!isSafari()) { // IE

            if (isOldIE) {
                jAlert('Seu navegador não dá suporte para a tecnologia (HTML5) que esta funcionalidade utiliza.', 'Mensagem', function () { });
                desabilitaControles(false);
                return false;
            }
            else {
                html2canvas(divMap, {
                    logging: true,
                    useCORS: true,
                    onrendered: function (canvas) {
                        //img = canvas.toDataURL('image/png');
                        //Canvas2Image.saveAsPNG(canvas);
                        img = Canvas2Image.saveAsJPEG(canvas, true);
                        //downloadIMG(img.src, "Mapa_" + (new Date()).getTime() + ".jpeg", 'image/jpeg');
                        canvas.toBlob(function (blob) {
                            saveAs(blob, "Mapa_" + (new Date()).getTime() + ".jpeg");
                            desabilitaControles(false);
                        });
                    }
                });
            }
        }
        else { // Safari
            html2canvas(jQuery('.olMapViewport'), {
                logging: true,
                useCORS: true,
                onrendered: function (canvas) {
                    //img = canvas.toDataURL('image/jpeg');
                    img = canvas.toDataURL();
                    //uriContent = "data:image/octet-stream;filename=Mapa.jpeg," + img;
                    //Util.popupwindow(uriContent, 'Mapa.jpeg', $('#map').width(), $('#map').height());
                    Util.popupwindow(img, 'CanvasImage', divMap.width(), divMap.height());
                    desabilitaControles(false);
                    //var j = Util.popupwindow('', 'CanvasImage', $('#map').width(), $('#map').height());
                    //j.document.write('');
                }
            });
        }
    }
        
}

desabilitaControles = function (bool) {
    var _display = (bool) ? 'none' : 'block';
    $('.olControlPanel').css('display', _display);
    $('#divFioMenu').css('display', _display);
    $('#divContornoEscalas').css('display', _display);
    $('#divEscalaLine').css('display', _display);
    $('#divEscalaInside').css('display', _display);
    $('#divImgNorte').css('display', _display);
    $('#divContornoMousePosition').css('display', _display);
    $('#divMousePosition').css('display', _display);
}