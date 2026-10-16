var loadAnaliseToolbar = function () {

    $.ajax("../js/analise-toolbar/tpl/analise-toolbar.html").done(function (html) {
        var tpl = _.template(html);
        $("#form1").append(tpl());
    });
}

var loadMedirToolbar = function () {
    $.ajax("../js/medir-tool/tpl/medir-toolbar.html").done(function (html) {
        var tpl = _.template(html);
        $("#form1").append(tpl());
    });
}



$(window).load(function () {
    $.when($.ajax("../js/generic-panel/tpl/panel.html")).done(function (html) {
        GeoSampa.GenericPanel = _.template(html);
        //neste caso nao sera carregada a toolbar do modulo de analise
        //loadAnaliseToolbar();
        loadMedirToolbar();
    });
});

var fill_turf = Array.prototype.fill;

GeoSampa.Eventos.on("MapaCarregado", function (Mapa) {
GeoSampa.Resultado = new Resultado();
GeoSampa.Resultado.initialize(Mapa);
delete Array.prototype.fill;

});






