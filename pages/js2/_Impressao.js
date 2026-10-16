/*********************************************************
Nome: _imprimeMapaCanvas()
Objetivo: Abre div de impressão
Disparador(es): ctlBtnImpressao
**********************************************************/
_imprimeMapaCanvas = function () {
    globalctlBtnImpressao.panel_div.className = globalctlBtnImpressao.displayClass + "ItemActive olButton";
    showDivImpressao();
}


/*********************************************************
Nome: imprimirMapa()
Objetivo: Abre div de impressão
Disparador(es): ctlBtnImpressao
**********************************************************/
var w = 680;
var h = 640;

var j = null;
imprimirMapa = function () {

    //if (j != null) { j.close(); }
    //j = Util.popupwindow('_Impressao.aspx', 'Mapa_Impresso', $(window).width(), $(window).height());
    //j = Util.popupwindow('_Impressao.aspx', 'Mapa_Impresso', w, h);
    var opts = 'toolbar=0,location=0,titlebar=0,directories=0,status=0,menubar=0,scrollbars=1,resizable=0,copyhistory=0';
    //var opts = 'toolbar=1,location=1,titlebar=1,directories=1,status=1,menubar=1,scrollbars=1,resizable=1,copyhistory=1';
    j = Util.popupwindowoptsrandom('_Impressao.aspx', 'Mapa_Impresso', w, h, opts);
    j.document.onunload = function () { opener.j = null; };
}


var map;
initMapPrint = function () {
 
    var options = {
        controls: [new OpenLayers.Control.DragPan()],
        maxExtent: bounds,
        resolutions: resolucoesMapa,
        projection: projecaoMapa,
        //displayProjection: new OpenLayers.Projection('EPSG:29193'),
        units: 'm'
    };
    map = new OpenLayers.Map('map', options);

    var corSelecao = {
        fillColor: "#00ffff",
        fillOpacity: 0.5,
        strokeColor: "#00ffff",
        strokeWidth: 2,
        pointRadius: 6
    };
    var styleSelecao = new OpenLayers.Style(corSelecao);


    var _layers = opener.map.layers;
    var _textFeats = [];
    for (var i = 0; i < _layers.length; i++) {
        var _l = null;
        

        switch (_layers[i].CLASS_NAME) {
            case 'OpenLayers.Layer.TMS':
                _l = new OpenLayers.Layer.TMS(_layers[i].name, _layers[i].url, _layers[i].getOptions());
                break;
            case 'OpenLayers.Layer.Vector':
                if (_layers[i].name.indexOf("OpenLayers.Control.DynamicMeasure") !== -1) {
                    var arrayname = _layers[i].name.split(' ');
                    var tipo = arrayname[1];
                    var estilo = new OpenLayers.StyleMap(OpenLayers.Control.DynamicMeasure.styles[tipo]);
                    _l = new OpenLayers.Layer.Vector(_layers[i].name, { styleMap: estilo });

                    for (var j = 0; j < _layers[i].features.length; j++) {
                        var feature = _layers[i].features[j].clone();
                        _l.addFeatures(feature);
                    }

                } else if (_layers[i].name.indexOf("OpenLayers.Handler") !== -1) {
                    console.log(_layers[i].name);
                    var arrayname = _layers[i].name.split('.');
                    var tipo = arrayname[2];
                    if (tipo == "Path") {
                        tipo = "Line";
                    }
                    var estilo = new OpenLayers.StyleMap(OpenLayers.Control.DynamicMeasure.styles[tipo]);
                    _l = new OpenLayers.Layer.Vector(_layers[i].name, { styleMap: estilo });

                    for (var j = 0; j < _layers[i].features.length; j++) {
                        var feature = _layers[i].features[j].clone();
                        _l.addFeatures(feature);
                    }
                } else {
                    switch (_layers[i].name) {
                        case "DesenhoPonto":
                            _l = new OpenLayers.Layer.Vector(_layers[i].name, { styleMap: DrawMarker });
                            for (var j = 0; j < _layers[i].features.length; j++) {
                                _l.addFeatures(_layers[i].features[j].clone());
                            }
                            break;
                        case "GroupMap":
                            _l = new OpenLayers.Layer.Vector(_layers[i].name, { styleMap: _GroupMapStyle });
                            for (var j = 0; j < _layers[i].features.length; j++) {
                                var feature = _layers[i].features[j].clone();
                                var stylefeature = { strokeColor: "#D3D3D3", fillColor: feature.attributes.cor };
                                feature.style = stylefeature;
                                _l.addFeatures(feature);
                            }
                            break;
                        case 'Desenho':
                            _l = new OpenLayers.Layer.Vector(_layers[i].name, { styleMap: DrawStyle });
                            for (var j = 0; j < _layers[i].features.length; j++) {
                                if (_layers[i].features[j]["featureType"] !== null && _layers[i].features[j]["featureType"] === "text") {
                                    _textFeats.push(_layers[i].features[j].clone());
                                } else {
                                    _l.addFeatures(_layers[i].features[j].clone());
                                }
                            }
                            break;
                        case 'DesenhoPonto':
                            _l = new OpenLayers.Layer.Vector(_layers[i].name, { styleMap: DrawStyle });
                            for (var j = 0; j < _layers[i].features.length; j++) {
                                if (_layers[i].features[j]["featureType"] !== null && _layers[i].features[j]["featureType"] === "text") {
                                    _textFeats.push(_layers[i].features[j].clone());
                                } else {
                                    _l.addFeatures(_layers[i].features[j].clone());
                                }
                            }
                            break;
                        case 'DesenhoTexto':
                            _l = new OpenLayers.Layer.Vector(_layers[i].name, { styleMap: DrawStyle });
                            for (var j = 0; j < _layers[i].features.length; j++) {
                                if (_layers[i].features[j]["featureType"] !== null && _layers[i].features[j]["featureType"] === "text") {
                                    _textFeats.push(_layers[i].features[j].clone());
                                } else {
                                    _l.addFeatures(_layers[i].features[j].clone());
                                }
                            }
                            break;
                        default:
                            _l = new OpenLayers.Layer.Vector(_layers[i].name, { styleMap: styleSelecao });
                            for (var j = 0; j < _layers[i].features.length; j++) {
                                _l.addFeatures(_layers[i].features[j].clone());
                            }
                            break;
                    }
                }

                break;
            case 'OpenLayers.Layer.WMS':
                _l = new OpenLayers.Layer.WMS(_layers[i].name, _layers[i].url, _layers[i].params, _layers[i].getOptions());
                break;
            default:
                break;
        }

        map.addLayers([_l]);

        //para resolver bug na impressão, atribui setIsBaseLayer FALSE para todas as camadas
        //_l.setIsBaseLayer(_layers[i].isBaseLayer);
        _l.setIsBaseLayer(false);
        _l.setVisibility(_layers[i].visibility);
    }
    var _GroupMapStyle = new OpenLayers.StyleMap({
        "default": new OpenLayers.Style({
            fillColor: "${cor}",
            fillOpacity: 0.95,
            strokeColor: "#D3D3D3",
            strokeOpacity: 0.95,
            strokeWidth: 2,
            pointRadius: 3,
            graphicName: "circle"
        })
    });
    var _TextStyle = new OpenLayers.StyleMap({
        "default": new OpenLayers.Style({
            fillColor: "${estilo}",
            fillOpacity: 0.8,
            strokeColor: "${estilo}",
            strokeWidth: 2,
            graphicZIndex: 11,
            pointRadius: 0,
            cursor: 'default',
            label: '${label}',
            fontColor: "${estilo}",
            fontSize: "${TamanhoFonte}",
            fontFamily: "Verdana, Arial, Helvetica, sans-serif",
            fontWeight: "bold",
            labelOutlineColor: '#000',
            labelOutlineWidth: 0,
            labelSelect: true
        })
    });

    var _textLayer = new OpenLayers.Layer.Vector("DesenhoTexto", {
        styleMap: _TextStyle,
        rendererOptions: { zIndexing: true },
        renderers: ["Canvas", "SVG", "VML"]
    });


    map.addLayers([_textLayer]);

    _textFeats.forEach(function (_item) {
        _item.featureType = 'text';
        _textLayer.addFeatures([_item]);
        _textLayer.drawFeature(_item, "default");
    });


    map.zoomToExtent(bounds);

    var ll = opener.map.getCenter().clone();
    var lat = ll.lat;
    var lon = ll.lon;
    var LonLat = new OpenLayers.LonLat(lon, lat);
    var z = opener.map.getZoom();

    map.fractionalZoom = true;

    map.moveTo(LonLat, z);

    map.controls[0].activate(); //ativando o controle DragPan

    exibeInfos();

}


exibeInfos = function () {

    var exibeEscala = jQuery('#chkEscalaImpressao', opener.window.document).prop('checked')
    var exibeLegenda = jQuery('#chkLegendaImpressao', opener.window.document).prop('checked')


    //Copiando Escala gráfica
    if (exibeEscala == true) {
        jQuery('#divEscalaLine').html(jQuery('#divEscalaLine', opener.window.document).html());
        jQuery('#divEscalaLine').css('display', jQuery('#divEscalaLine', opener.window.document).css('display'));
    }

    //Copiando Escala textual e imagem do norte
    jQuery('#divImgNorte').html(jQuery('#divImgNorte', opener.window.document).html());
    jQuery('#divEscalaInside').html(jQuery('#divEscalaInside', opener.window.document).html());
    //jQuery('#divEscalaInside').append('<input type="text" disabled style="width:70px;" value="' + jQuery('#cboEscala option:selected', opener.window.document).text() + '">');
    jQuery('#divEscalaInside').append('<input type="text" disabled style="width:70px;" value="' + jQuery('#txtEscala', opener.window.document).val() + '">');
    jQuery('#cboEscala').css('display', 'none');
    jQuery('#txtEscala').css('display', 'none');

    //Copiando o título
    jQuery('#lblTitulo').text(jQuery('#txtTituloMapaImpressao', opener.window.document).val());

    //Setando o link da aplicação
    var lnk = jQuery(location).attr('href');
    lnk = lnk.replace('_Impressao.aspx', '_SBC.aspx');
    jQuery('#lblURL').text(lnk);

    //Setando horário de impressão
    var d = new Date();
    var dia = (d.getDate() < 10) ? ('0' + (d.getDate())) : (d.getDate());
    var mes = ((d.getMonth() + 1) < 10) ? ('0' + (d.getMonth() + 1)) : (d.getMonth() + 1);
    var data = dia + '/' + mes + '/' + d.getFullYear();
    var hora = (d.getHours() < 10) ? ('0' + (d.getHours())) : (d.getHours());
    var minutos = (d.getMinutes() < 10) ? ('0' + (d.getMinutes())) : (d.getMinutes());
    var segundos = (d.getSeconds() < 10) ? ('0' + (d.getSeconds())) : (d.getSeconds());
    var horario = hora + ':' + minutos + ':' + segundos;
    jQuery('#lblDtHr').text(data + ' ' + horario);

    //Criando legendas
    if (exibeLegenda == true) {
        mostraLegendas();
    } else {
        jQuery('#divLegendasInfo').css('display', 'none');
    }
}

mostraLegendas = function () {
    var _layers = opener.map.layers;
    var arrHTMLIMGsTematico = new Array();
    var arrHTMLIMGsNaoTematico = new Array();
    var legendaMapa = '';
    for (var i = 0; i < _layers.length; i++) {
        var camada = _layers[i];

        if (camada.name === 'GroupMap') {
            legendaMapa = camada.attribution.legenda;

        }
        if (camada.visibility && (camada.CLASS_NAME == 'OpenLayers.Layer.TMS' || camada.CLASS_NAME == 'OpenLayers.Layer.WMS')) {
            if (eval(camada.tematico)) {
                var obj = { 'src': camada.src_tematico, 'lbl': camada.legendaLabel.replace('undefined ', '') };
                arrHTMLIMGsTematico.push(obj);
            }
            else {
                var obj = { 'src': camada.scr_legenda, 'lbl': camada.legendaLabel.replace('undefined ', '') };
                arrHTMLIMGsNaoTematico.push(obj);
            }
        }
    }

    if (arrHTMLIMGsTematico.length > 0 || arrHTMLIMGsNaoTematico.length > 0) {

        var div = '<div id="thumbContainer">';
        var c = 0;
        for (var i = 0; i < arrHTMLIMGsTematico.length; i++) {
            div += '<div id="thumbT"><center>' + arrHTMLIMGsTematico[i].lbl + '<br /><img src="' + arrHTMLIMGsTematico[i].src + '"></center></div>';
            if (c++ % 4 == 0) {
                div += '<div style="page-break-after:avoid"></div>';
            }
        }
        div += '<div style="page-break-after:avoid"></div>';
        for (var i = 0; i < arrHTMLIMGsNaoTematico.length; i++) {
            div += '<div id="thumbNT"><img src="' + arrHTMLIMGsNaoTematico[i].src + '">&nbsp;<label>' + arrHTMLIMGsNaoTematico[i].lbl + '</label></div>';
        }

        div += legendaMapa;

        jQuery('#InfoFlutuante').html(jQuery('#InfoFlutuante', opener.window.document).html());
        var infos = jQuery('#InfoFlutuante').html();

        jQuery('#divLegendasInfo').html(jQuery('#divLegendasInfo').html() + div + infos);

    }
    else {
        jQuery('#divLegendasInfo').css('display', 'none');
    }


    /*
    
    if (arrHTMLIMGsTematico.length > 0 || arrHTMLIMGsNaoTematico.length > 0) {
    //var _htmlTitulo = '<tr>';
    var _htmlImagem = '<tr>';
    var _htmlImagemNaoTematico = '';
    for (var i = 0; i < arrHTMLIMGsTematico.length; i++) {
    //_htmlTitulo += '<td>' + arrHTMLIMGsTematico[i].lbl + '</td>';
    _htmlImagem += '<td>' + arrHTMLIMGsTematico[i].lbl + '<br /><img src="' + arrHTMLIMGsTematico[i].src + '"></td>';
    }
    for (var i = 0; i < arrHTMLIMGsNaoTematico.length; i++) {
    _htmlImagemNaoTematico += '<div style="height:10px;" id="thumb"><img src="' + arrHTMLIMGsNaoTematico[i].src + '">&nbsp;' + arrHTMLIMGsNaoTematico[i].lbl + '</div><br />';
    }

    //_htmlTitulo += '<td></td>';
    _htmlImagem += '<td style="vertical-align:top;">' + _htmlImagemNaoTematico + '</td>';

    //_htmlTitulo += '</tr>';
    _htmlImagem += '</tr>';
        
    var _html = _htmlTitulo + _htmlImagem;
        
    jQuery('#tblLegendas').append(_html);
    }
    else {
    jQuery('#divLegendasInfo').css('display', 'none');
    }

    */



}


imprimir = function () {
    //jQuery('#divBtnPrint').css('display', 'none');
    window.print();
    //jQuery('#divBtnPrint').css('display', 'block');
}

/*

if (!jQuery.browser.msie) {

html2canvas(document.getElementById('map'), {
onrendered: function (canvas) {
var j = Util.popupwindow('', 'Mapa_Impresso', '800', '600');
//j.document.write('<title>.: Sistema de Consulta do Mapa Digital da Cidade de São Paulo :.</title>');
var domTitulo = document.createElement('TITLE');
var txtTitulo = document.createTextNode('.: Sistema de Consulta do Mapa Digital da Cidade de São Paulo :.');
var domLink = document.createElement('A');
domLink.href = canvas.toDataURL();
domLink.target = '_self';
var domLink = document.createElement('IMG');
domLink.src = canvas.toDataURL();
var txtLink = document.createTextNode('Download');
domLink.appendChild(txtLink);
domTitulo.appendChild(txtTitulo);
j.document.body.appendChild(domTitulo);
j.document.body.appendChild(domLink);
//j.document.body.appendChild(canvas);
}
});

}
else {

var j = Util.popupwindow('', 'Mapa_Impresso', '800', '600');
j.document.write('<title>.: Sistema de Consulta do Mapa Digital da Cidade de São Paulo :.</title>');
j.document.write('<div id="map">' + jQuery('.olLayerDiv').html() + '</div>');
//var domTitulo = document.createElement('TITLE');
//var txtTitulo = document.createTextNode('.: Sistema de Consulta do Mapa Digital da Cidade de São Paulo :.');
//domTitulo.appendChild(txtTitulo);
//j.document.body.appendChild(domTitulo);
//j.document.body.appendChild(canvas);

    
html2canvas([document.getElementById('map')], {
onrendered: function (canvas) {
var imageData = canvas.toDataURL('image/png', 1.0);
var j = popupwindow('', 'Mapa_Impresso', '800', '600');
}
});
    
}
*/


