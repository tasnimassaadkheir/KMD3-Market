

var Util = {
    'includejs': function (file_path) {
        //document.write('<' + 'script src="' + file_path + '?' + Math.random() + '"' + ' type="text/javascript"><' + '/script>');
        document.write('<' + 'script src="' + file_path + '"' + ' type="text/javascript"><' + '/script>');
        /*
        const s = document.createElement('script');
        s.src = file_path;
        s.type = "text/javascript";
        s.async = false;
        s.onload = function () {
            //console.log(this.src);
        };
        document.head.appendChild(s);
        */
    },
    'includejs_once': function (file_path) {
        var sc = document.getElementsByTagName("script");
        if (file_path != '') {
            var _arrFilePath = file_path.split('/');
            var _file = _arrFilePath[_arrFilePath.length - 1];
            for (var x in sc) {
                if (sc[x].src != null) {
                    var _arrSrc = sc[x].src.split('/');
                    var _srcFile = _arrSrc[_arrSrc.length - 1];
                    if (_srcFile.indexOf(_file) != -1)
                        return;
                }
            }
            this.includejs(file_path);
        }
    },
    'includecss': function (file_path) {
        //document.write('<' + 'link href="' + file_path + '?' + Math.random() + '"' + ' rel="stylesheet" type="text/css"><' + '/link>');
        const s = document.createElement('link');
        s.href = file_path + '?' + Math.random();
        s.rel = "stylesheet";
        s.type = "text/css";
        document.head.appendChild(s);
    },
    'includecss_once': function (file_path) {
        var sc = document.getElementsByTagName("link");
        if (file_path != '') {
            var _arrFilePath = file_path.split('/');
            var _file = _arrFilePath[_arrFilePath.length - 1];
            for (var x in sc) {
                if (sc[x].href != null) {
                    var _arrSrc = sc[x].href.split('/');
                    var _srcFile = _arrSrc[_arrSrc.length - 1];
                    if (_srcFile.indexOf(_file) != -1)
                        return;
                }
            }
            this.includecss(file_path);
        }
    },
    'popupwindow': function (url, title, w, h) {
        var left = (screen.width / 2) - (w / 2);
        var top = (screen.height / 2) - (h / 2);
        return window.open(url, title, 'toolbar=0,location=0,titlebar=0,directories=0,status=0,menubar=0,scrollbars=0,resizable=0,copyhistory=0,width=' + w + ',height=' + h + ',top=' + top + ',left=' + left);
    },
    'popupwindowopts': function (url, title, w, h, opts) {
        var left = (screen.width / 2) - (w / 2);
        var top = (screen.height / 2) - (h / 2);
        //opts = (opts=='')?'toolbar=0,location=0,titlebar=0,directories=0,status=0,menubar=0,scrollbars=0,resizable=0,copyhistory=0':opts;
        return window.open(url, title, opts + ',width=' + w + ',height=' + h + ',top=' + top + ',left=' + left);
    },
    'popupwindowoptsrandom': function (url, title, w, h, opts) {
        var left = (screen.width / 2) - (w / 2);
        var top = (screen.height / 2) - (h / 2);
        var rdmNum = Math.floor((Math.random() * 100000) + 1);
        //opts = (opts=='')?'toolbar=0,location=0,titlebar=0,directories=0,status=0,menubar=0,scrollbars=0,resizable=0,copyhistory=0':opts;
        return window.open(url + '?id=' + rdmNum, title, opts + ',width=' + w + ',height=' + h + ',top=' + top + ',left=' + left);
    }
};


//incluindo um arquivo com a função include()
//Util.includejs("arquivo.js");

//incluindo um arquivo com a função include_once()
//Util.includejs_once("arquivo.js");
