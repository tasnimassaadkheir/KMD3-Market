/*
OBS.: Este arquivo depende da biblioteca OpenLayers.js
*/
/*************************************************************************************************************************************************************
**************************************************** DEFINIÇÕES E DECLARAÇÕES ********************************************************************************
**************************************************************************************************************************************************************/

//Definições globais do Openlayers
OpenLayers.Feature.Vector.style['default']['strokeWidth'] = 0;
OpenLayers.Feature.Vector.style['select']['strokeWidth'] = 2;
OpenLayers.Feature.Vector.style['select']['strokeColor'] = '#00ffff';
OpenLayers.Feature.Vector.style['select']['fillColor'] = '#00ffff';
OpenLayers.Feature.Vector.style['select']['fillOpacity'] = 0.5;



/******************************************************************************************************
/******************************************************************************************************
/******************************************************************************************************

/* DECLARA TODOS OS CONTROLES - OS ÍNDICES SÓ DEVERÃO SER ALTERADOS AQUI */
var globalctlDrg;
var globalctlZin;
var globalctlZou;
var globalctlZoomBox;
var globalctlBtnGetBBoxLidar;
var globalctlTransform;
var globalctlBBoxLidar3D
var globalctlMzoom;
var globalctlDistancia;
var globalctlDesenho;
var globalctlImportar;
//var globalctlBtnQuadraFiscal;
var globalctlBtnPDF;
var globalctlBtnPDFSetor;
var globalctlBtnPDFSetor;
var globalctlBtnPDFQuadra;
var globalctlBtnExibeCroqui;
var globalctlBtnShowLayers;
var globalctlBtnImpressao;
var globalctlBtnPesquisaLogradouro;
var globalctlBtnExibeInfo;
var globalctlBtnLimpaSelecao;
var globalctlPegaLatLon;
var globalctlBtnSelecao;
var globalctlBtnConfig;
var globalctlBtnHelp;
var globalctlGetSelecao;
var globalctlNavega;
var globalctlSelecaoGetFeatureDinamico;
var globalMousePosition;
var globalScaleLine;
var globalctlBtnDownloadImagem;
var globalctlBtnBookmark;   //botão
var globalBookmark;         //controle
var globalFormatOutput;
var globalctlBtnContato;
var globalctlNav;
var globalctlBtnCoordenadas;
var globalctlPegaLatLonCoord;
var globalctlBtnDownloadArquivos;
var globalctlGetSelecaoDown;
var globalctlGetQuadriculaDown;
var globalctlGetQuadriculaLatLon;
var globalctlGetAreaPublicaLatLon;
var globalctlGetLoteamentoLatLon;
var globalctlGetAreaCedidaLatLon;
var globalctlGetPlantaDISDUPLatLon;
var geoJSONParser = new OpenLayers.Format.GeoJSON


//Declarações de variáveis globais
var map, layerLogradouroSelect, vectorQuadrasSelecionadas, vectorCamadaSelecao, debug, popupEscala, vectorCamadaSelecaoDown, vectorCamadaMapaArticulado, croquiPatrimonialSelect, areaCedidaSelect, plantaDISDUPSelect;
var _vCoordenadaClick;
var LayerSelecaoMapaArticulado, LayerSelecaoAreaPublica, LayerSelecaoLoteamento, LayerSelecaoAreaCedida;
//var handleGetFeature;
var handleGetFeatureSetor;
var handleGetFeatureQuadra;
var handleGetFeatureInfo;
var lonLatSelecao;
var habilitaInfo;
var habilitaPDF;
var habilitaSelecao;
var globalLoteIntegracao;

//Seta defs de projeções
Proj4js.defs["EPSG:29193"] = "+proj=utm +zone=23 +south +ellps=aust_SA +towgs84=-67.35,3.88,-38.22,0,0,0,0 +units=m +no_defs";
Proj4js.defs["EPSG:4618"] = "+proj=longlat +ellps=aust_SA +towgs84=-67.35,3.88,-38.22,0,0,0,0 +no_defs";
Proj4js.defs["EPSG:31983"] = "+proj=utm +zone=23 +south +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs";
//Proj4js.defs["EPSG:3857"] = "+proj=merc +lon_0=0 +k=1 +x_0=0 +y_0=0 +a=6378137 +b=6378137 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs";  //Google Maps
//Proj4js.defs["SR-ORG:7483"] = "+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext  +no_defs";
//Proj4js.defs["SR-ORG:6864"] = "+proj=merc +lon_0=0 +k=1 +x_0=0 +y_0=0 +a=6378137 +b=6378137 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs";


//Declarações de variáveis globais Openlayers
//var resolucoesMapa = [195.3125, 97.65625, 48.828125, 24.4140625, 12.20703125, 6.103515625, 3.0517578125, 1.52587890625, 0.762939453125, 0.3814697265625, 0.19073486328125];
//var resolucoesMapa = [224.609375, 112.3046875, 56.15234375, 28.076171875, 14.0380859375, 7.01904296875, 3.509521484375, 1.7547607421875, 0.87738037109375, 0.438690185546875, 0.2193450927734375];
/*P016957 - 10/04/2014 - Alteração das resoluções (Solicitação do analista Sérgio Ricardo)*/
var resolucoesMapa = [223.99999999999997,
                    111.99999999999999,
                    55.99999999999999,
                    28.000056000212016,
                    13.999999999999998,
                    6.999999999999999,
                    2.8,
                    1.4,
                    0.5599999999999999,
                    0.28,
                    0.14]; /*10/04/2014*/

//var projecaoMapa = new OpenLayers.Projection('EPSG:29193');
var projecaoMapa = new OpenLayers.Projection('EPSG:31983');


//var boundsCidade = new OpenLayers.Bounds(312000, 7340000, 362000, 7420000);
//ATUAL  var boundsCidade = new OpenLayers.Bounds(313247.55859375, 7333630.6484374, 356260.25390625, 7416286.8984374);
var boundsCidade = new OpenLayers.Bounds(312124.51171875, 7342924.1132812, 356035.64453125, 7426029.5820312);
var bounds = new OpenLayers.Bounds(248200, 7324100, 420700, 7439100);

//Declaração das constantes
var NM_LAYER_LOGRADOURO_PESQUISA_WFS = 'geoportal:endereco_v2' //'DU0110_11_SBC_20:V6318_SLOG_DEN_PGW_G';
var NM_NAMESPACE_QDR_VIAR = "DU0110_11_SBC_20:V6321_QDR_VIAR_PGW_G";
var NM_GEOMETRIA_LOGRADOURO = NM_GEOMETRIA_QDR_VIAR = 'ge_ponto';
//var NM_LAYER_SETOR_PESQUISA_WFS = 'DU0110_11_SBC_20:V6319_SET_FISC_PGW_G';
var NM_LAYER_SETOR_PESQUISA_WFS = 'geoportal:setor_fiscal_gsc'; //'DU0110_11_SBC_20:V6399_SETFIS_PGW_G';
var NM_LAYER_SUBPREFEITURAS_WFS = 'geoportal:subprefeitura_v2'; //'DU0110_11_SBC_20:V6316_SUBP_PGW_G';
var NM_LAYER_DISTRITO_WFS = 'geoportal:distrito_municipal_v2'; //'DU0110_11_SBC_20:V6349_DIST_MUN_PGW_G';
var NM_LAYER_APOIO_TERRESTRE_WFS = ''; //'DU0110_11_SBC_20:V6384_MARCO_PGW_G';
var NM_LAYER_MARCO_WFS = 'geoportal:marco_v2'; //'DU0110_11_SBC_20:V6384_MARCO_PGW_G';
var NM_LAYER_LOTE_WFS = 'geoportal:lote_v3'; //'DU0110_11_SBC_20:V6314_LOTE_PGW_G';

var NM_LAYER_AREA_PUBLICA_WFS = 'GEOSAMPA:cadastro_area_publica_cidadao'; //'DU0110_11_SBC_20:V6365_ARE_MUN_SIP_G';
var NM_GEOMETRIA_AREA_PUBLICA = 'ge_multipoligono'; // 'GEO_PLGN_AREA_MNCP';
var NM_LAYER_QUADRA_FISCAL_WFS = 'geoportal:quadra_fiscal_v2'; //'DU0110_11_SBC_20:V6406_QP_SF_CR_PGW_G';

var NM_LAYER_MAPA_ARTICULADO_QUADRICULA_WFS = 'geoportal:quadricula';
//var NM_LAYER_MAPA_ARTICULADO_QUADRICULA_WFS = 'geoportal:quadricula_orto_2001_emplasa_v2';  //é alterada dinâmicamente quando o valor do combo é selecionado

var NM_LAYER_LOTEAMENTO_CROQUI_AREA_WFS = 'GEOSAMPA:croqui_patrimonial_cidadao';
var NM_LAYER_AREA_CEDIDA_WFS = 'geoportal:area_cedida_cidadao';
var NM_LAYER_PLANTA_DIS_DUP_WFS = 'geoportal:planta_dup_dis_pd';
var NM_GEOMETRIA_MAPA_ARTICULADO = NM_GEOMETRIA_QUADRA_FISCAL = NM_GEOMETRIA_SUBPREFEITURA = NM_GEOMETRIA_DISTRITO = NM_GEOMETRIA_LOTE = NM_GEOMETRIA_SETOR = NM_GEOMETRIA_PLANTA_DIS_DUP = 'ge_poligono';
var NM_GEOMETRIA_LOTEAMENTO_CROQUI_AREA = 'ge_multipoligono';
var NM_GEOMETRIA_AREA_CEDIDA = 'ge_multipoligono';
var NM_GEOMETRIA_MARCO = NM_GEOMETRIA_APOIO_TERRESTRE = 'ge_ponto';


var layersVisiveis = new Array();
var layersInvisiveis = new Array();


var layersCargaInicialMapa = new Array();

var layersSelect = new Array();
var layersInfo = new Array();

var layersPaiInfo = new Array();
var layersFilhoInfo = new Array();

var layersVectorInfoTemp = new Array();
var globalListaInfoGrid = new Array();

//Seta render DPI
OpenLayers.DOTS_PER_INCH = 90.71428571428572;


/*********************************************************
Nome: pesquisaCroqui()
Objetivo: Faz a pesquisa do croqui por setor e quadra
Disparador(es): 
**********************************************************/
pesquisaCroqui = function () {
    var nrSetor = jQuery('#txtVisuSetor').val();
    var nrQuadra = jQuery('#txtVisuQuadra').val();

    if (parseInt(nrSetor, 10) < 1 || parseInt(nrSetor, 10) > 310 || parseInt(nrSetor, 10) == 092) {
        jAlert('Para o campo Setor os valores válidos estão entre 001 e 310. Exceto 092', 'Mensagem', function () { });
        closeloading();
        return false;
    }

    if (parseInt(nrQuadra, 10) < 1 || parseInt(nrQuadra, 10) > 999) {
        jAlert('Para o campo Quadra os valores válidos estão entre 001 e 999.', 'Mensagem', function () { });
        closeloading();
        return false;
    }

    if (nrSetor != "" && nrQuadra != "") {
        window.open("DownloadCroqui.aspx?setor=" + nrSetor + "&quadra=" + nrQuadra, 'window' + nrSetor + nrQuadra);
        /*} else if (nrSetor != "") {
        window.open("DownloadCroqui.aspx?setor=" + nrSetor, 'window' + nrSetor);*/
    } else {
        jAlert('Favor preencher os campos obrigatórios', 'Mensagem', function () { });
    }
}






/*********************************************************
Nome: pesquisaLogradouro()
Objetivo: Faz a pesquisa do logradouro e tipo digitados no formulário
Disparador(es): Clique no botão do formulário "btnPesquisaLogradouro"
**********************************************************/
pesquisaLogradouro = function () {
    var tpLog, nmLog, ttLog;

    tpLog = jQuery('#cboTIPO_COD').val();
    ttLog = jQuery('#cboTITULO_COD').val();
    nmLog = jQuery('#nome').val();
    nrLog = jQuery('#numero').val();
    nrCodLog = jQuery('#codLogPesq').val();

    //console.log(tpLog + ' - ' + nmLog);
    //console.log(tpLog != '' && nmLog != '');

    //Caso tenha digitado um nome de logradouro
    if (nmLog != '') {
        loading(); // loading popup
        //Chamada ao método de pesquisa no lado do servidor com retorno para as funções de callback: onSuccessPesqLog e onErrorPesqLog
        PageMethods.pesquisaLogradouro(tpLog, ttLog, nmLog, nrLog, onSuccessPesqLog, onErrorPesqLog);

    } else if (nrCodLog != '') {
        exibeLogradouroSelecionado(nrCodLog, '', '');
        closeloading();
        return false;
    } else {
        jAlert('Digite um nome de logradouro para pesquisa.', 'Mensagem', function () { });
        closeloading();
        return false;
    }

}


/*********************************************************
Nome: onSuccessPesqLog()
Objetivo: Captura o retorno de sucesso e chama a função de exibição do grid de pesquisa de logradouro
Parâmetro(s): result - objeto de retorno do método de pesquisa no lado do servidor
Disparador(es): callback de sucesso da função pesquisaLogradouro()
*********************************************************/
onSuccessPesqLog = function (result) {
    //console.log(result);
    var nrLog = jQuery('#numero').val();
    carregaGridLogradouro(result, nrLog);
    //carregaGridLogradouro(result);
}



/*********************************************************
Nome: onErrorPesqLog()
Objetivo: Captura o retorno de erro e exibe no console
Disparador(es): callback de erro da função pesquisaLogradouro()
*********************************************************/
onErrorPesqLog = function (desc) {
    console.log(desc);
}



/*********************************************************
Nome: pesquisaLogradouroLote()
Objetivo: Faz a pesquisa das outras abas, ainda não implementada
Disparador(es): Clique no botão do formulário "btnPesquisaLogradouro"
**********************************************************/
pesquisaLogradouroLote = function () {
    //jAlert('Funcionalidade em desenvolvimento.', 'Mensagem', function () { });

    var tpLog, nmLog, ttLog;

    tpLog = jQuery('#cboTIPO_COD_LOTE').val();
    ttLog = jQuery('#cboTITULO_COD_LOTE').val();
    nmLog = jQuery('#txtNomeEnderecoLote').val();
    nrLog = jQuery('#numero').val();

    //console.log(tpLog + ' - ' + nmLog);
    //console.log(tpLog != '' && nmLog != '');

    //Caso tenha digitado um nome de logradouro
    if (nmLog != '') {
        loading(); // loading popup
        //Chamada ao método de pesquisa no lado do servidor com retorno para as funções de callback: onSuccessPesqLog e onErrorPesqLog
        PageMethods.pesquisaLogradouro(tpLog, ttLog, nmLog, nrLog, onSuccessPesqLogLote, onErrorPesqLogLote);
    }
    else {
        jAlert('Digite um nome de logradouro para pesquisa.', 'Mensagem', function () { });
        closeloading();
        return false;
    }

}


/*********************************************************
Nome: onSuccessPesqLogLote()
Objetivo: Captura o retorno de sucesso e chama a função de exibição do grid de pesquisa de logradouro do lote
Parâmetro(s): result - objeto de retorno do método de pesquisa no lado do servidor
Disparador(es): callback de sucesso da função pesquisaLogradouroLote()
*********************************************************/
onSuccessPesqLogLote = function (result) {
    carregaGridLogradouroLote(result);
}

/*********************************************************
Nome: onErrorPesqLogLote()
Objetivo: Captura o retorno de erro e exibe no console
Disparador(es): callback de erro da função pesquisaLogradouroLote()
*********************************************************/
onErrorPesqLogLote = function (desc) { console.log(desc); }




/*********************************************************
Nome: exibeLogradouroSelecionado()
Objetivo: Exibe no mapa o logradouro selecionado 
Parâmetro(s):   codLog - Código do logradouro selecionado
x - Coordenada X do logradouro pesquisado
y - Coordenada Y do logradouro pesquisado
Disparador(es): Clique no link do grid da pesquisa de logradouros
*********************************************************/

exibeLogradouroSelecionado = function (codLog, codIdLog, nrLog) {
    //exibeLogradouroSelecionado = function (codLog, dvCodLog, nrLog) {
    loading();

    //*************************************************************************************************INICIO ALTERACAO

    if (nrLog !== "") {
        //PageMethods.pesquisaLogradouroCoordenadas(codLog, dvCodLog, nrLog, onSuccessPesqLogCoord, onErrorPesqLogCoord);
        PageMethods.pesquisaLogradouroCoordenadas(codIdLog, nrLog, onSuccessPesqLogCoord, onErrorPesqLogCoord);
    } else {
        var _hc = jQuery('#hc', window.parent.document).val();

        if (codLog !== "") {
            var cqlFilter = "codlog='" + codLog + "'";
        } else {
            var cqlFilter = "cd_identificador_logradouro='" + codIdLog + "'";
        }


        //Reseta o mapa
        resetaLogradouro();
        resetaQuadra();
        resetaInfoPesq();

        var logradouroSelect_wfs_options = {
            url: 'map.geo?hc=' + _hc + '&tipoServico=DWFS1',
            transparent: true,
            params: {
                request: "GetFeature",
                service: "wfs",
                version: "1.0.0",
                typeName: "v_logradouro_segmento",
                featureType: "v_logradouro_segmento",
                CQL_FILTER: cqlFilter
            },
            format: new OpenLayers.Format.GML({
                geometryName: "ge_linha"
            })
        };

        OpenLayers.Feature.Vector.style["select"].strokeWidth = 2;

        layerLogradouroSelect = new OpenLayers.Layer.Vector("Logradouro Pesquisado", {
            strategies: [new OpenLayers.Strategy.Fixed()],
            protocol: new OpenLayers.Protocol.HTTP(logradouroSelect_wfs_options),
            styleMap: new OpenLayers.Style(OpenLayers.Feature.Vector.style["select"])
        });

        map.addLayer(layerLogradouroSelect);

        layerLogradouroSelect.events.register("featureadded", this, function (e) {
            var lat, lon, zoom;
            //lon = layerLogradouroSelect.features[0].geometry.x;
            lon = layerLogradouroSelect.features[0].geometry.getCentroid().x;
            //lat = layerLogradouroSelect.features[0].geometry.y;
            lat = layerLogradouroSelect.features[0].geometry.getCentroid().y;
            zoom = 7;
            var olLonLat = new OpenLayers.LonLat(lon, lat);

            //Setando a posição do mapa para o logradouro pesquisado
            //map.setCenter(olLonLat, zoom, false, false);
            map.moveTo(olLonLat, zoom);

            closeloading();
        });

    }

    //*************************************************************************************************FIM ALTERACAO

}

onSuccessPesqLogCoord = function (result) {

    if (result.length == 0) {
        jAlert('Localidade não possui as coordenadas mapeadas.', 'Mensagem', function () { });
        closeloading();
        return false;
    }

    var DadosLog = result[0];

    //console.log(DadosLog);

    //Reseta o mapa
    resetaLogradouro();
    resetaQuadra();
    resetaInfoPesq();

    //Variáveis utilizadas para setar o mapa até a posição do logradouro pesquisado
    var codLog, lat, lon, zoom, codIdLog;
    //**   codLog = DadosLog['COD_LOG'];
    //**   lon = DadosLog['X'];
    //**   lat = DadosLog['Y'];
    codIdLog = DadosLog.COD_ID_END;

    //Montagem da string de filtro CQL
    var cqlFilter = "cd_identificador_endereco=" + codIdLog;

    var _hc = jQuery('#hc', window.parent.document).val();

    var logradouroSelect_wfs_options = {
        url: 'map.geo?hc=' + _hc + '&tipoServico=DWFS1',
        transparent: true,
        params: {
            request: "GetFeature",
            service: "wfs",
            version: "1.0.0",
            typeName: NM_LAYER_LOGRADOURO_PESQUISA_WFS,
            featureType: NM_LAYER_LOGRADOURO_PESQUISA_WFS,
            CQL_FILTER: cqlFilter
        },
        format: new OpenLayers.Format.GML({
            geometryName: NM_GEOMETRIA_LOGRADOURO
        })
    };


    OpenLayers.Feature.Vector.style["select"].strokeWidth = 2;

    layerLogradouroSelect = new OpenLayers.Layer.Vector("Logradouro Pesquisado", {
        strategies: [new OpenLayers.Strategy.Fixed()],
        protocol: new OpenLayers.Protocol.HTTP(logradouroSelect_wfs_options),
        styleMap: new OpenLayers.Style(OpenLayers.Feature.Vector.style["select"])
    });



    //Adicionando a camada do logradouro pesquisado no mapa
    map.addLayers([layerLogradouroSelect])

    layerLogradouroSelect.events.register("featureadded", this, function (e) {
        var lat, lon, zoom;
        lon = layerLogradouroSelect.features[0].geometry.x;
        lat = layerLogradouroSelect.features[0].geometry.y;
        zoom = 7;
        var olLonLat = new OpenLayers.LonLat(lon, lat);

        //Setando a posição do mapa para o logradouro pesquisado
        //map.setCenter(olLonLat, zoom, false, false);
        map.moveTo(olLonLat, zoom);

        closeloading();
    });


    //Fechando a popup de pesquisa
    //fechaPopup();
    document.getElementById('drag').style.display = 'none';
    //map.controls[9].panel_div.className = map.controls[9].displayClass + "ItemInactive olButton";
    globalctlBtnPesquisaLogradouro.panel_div.className = globalctlBtnPesquisaLogradouro.displayClass + "ItemInactive olButton";
}

onErrorPesqLogCoord = function (desc) {
    console.log(desc);
}


var codLogLote, dvCodLogLote, nrLogLote;
exibeLogradouroLoteSelecionado = function (codLog, dvCodLog) {
    codLogLote = codLog;
    dvCodLogLote = dvCodLog;
    jQuery('#tblPesqLogLote').css('display', 'none');
    jQuery('#tblPesqLogLote2').css('display', 'block');
    jQuery('#tdEnderecoLote').html(jQuery('#lnkEndLote_' + codLogLote + '_' + dvCodLogLote).html());

    limpaPesquisaLogradouroLote();
    jQuery('#txtNumeroLogLote').val('');
    jQuery('#txtNumeroLogLote').mask("?999999", { placeholder: '' });
}

limpaPesquisaLogradouroLote = function () {

    //limpando pesquisa anterior
    jQuery('#lstLogradourosLote option[value!="0"]').remove();
    jQuery('#lstLogradourosLote').css('display', 'none');
    jQuery('#lblMsgLote').html('');

}

pesquisaEnderecoLoteNumero = function () {

    limpaPesquisaLogradouroLote();

    nrLogLote = jQuery('#txtNumeroLogLote').val();

    if (nrLogLote == '') {
        jAlert('Por favor, informe o número desejado.', 'Mensagem', function () { });
        return false;
    }

    loading();

    PageMethods.pesquisaLogradouroLote(codLogLote, dvCodLogLote, nrLogLote, onSuccessPesqEndLoteNumero, onErrorPesqEndLoteNumero)

}

var layerLoteLogradouroSelect;
onSuccessPesqEndLoteNumero = function (result) {
    //3.Tratamento do retorno da pesquisa pelo numero informado

    //a.Se a pesquisa não retornar registros, exibir a mensagem “Não há registros para a pesquisa realizada.”
    if (result.length == 0) {
        jAlert('Não há registros para a pesquisa realizada.', 'Mensagem', function () { });
        closeloading();
        return false;
    }

    var _flagNrEncontrado = false;
    var _cdNrEndImov, _featid, _indexFeatid;

    for (var i = 0; i < result.length; i++) {
        _cdNrEndImov = result[i]['CD_NRO_ENDE_IMOV'];

        //b.Se no cursor retornado existir um registro que o COD_NRO_ENDE_IMOV seja igual ao numero informado pelo usuário do sistema
        if (nrLogLote == _cdNrEndImov) {
            _flagNrEncontrado = true;
            _indexFeatid = i;
            _featid = result[_indexFeatid]['FEATID'];
            break;
        }
    }

    //b.Se no cursor retornado existir um registro que o COD_NRO_ENDE_IMOV seja igual ao numero informado pelo usuário do sistema
    if (_flagNrEncontrado) {

        //i.	Exibir uma lista com o número encontrado no formato: [nome do logradouro], [COD_NRO_ENDE_IMOV];
        jQuery('#lstLogradourosLote').append('<option value="' + result[_indexFeatid]['FEATID'] + '">' + jQuery('#lnkEndLote_' + codLogLote + '_' + dvCodLogLote).html() + ',' + nrLogLote + '</option>');
        jQuery('#lstLogradourosLote').css('display', 'block');
        closeloading();

    } //c.	Se no cursor retornado não existir um registro que o COD_NRO_ENDE_IMOV seja igual ao numero informado pelo usuário do sistema
    else {

        for (var i = 0; i < result.length; i++) {
            //i.	Exibir uma lista com os números encontrados no formato: [nome do logradouro], [COD_NRO_ENDE_IMOV];
            jQuery('#lstLogradourosLote').append('<option value="' + result[i]['FEATID'] + '">' + jQuery('#lnkEndLote_' + codLogLote + '_' + dvCodLogLote).html() + ',' + result[i]['CD_NRO_ENDE_IMOV'] + '</option>');

        }

        jQuery('#lblMsgLote').html('Número não encontrado. Localizados os números mais próximos.');
        jQuery('#lstLogradourosLote').css('display', 'block');
        closeloading();
    }


    jQuery('#lstLogradourosLote').change(function () {

        //console.log(this.value);

        var featid = this.value;

        if (parseInt(featid) > 0) {

            loading();

            //Reseta o mapa
            _limpaSelecao();

            //Montagem da string de filtro CQL
            var cqlFilter = "cd_identificador_lote = '" + featid + "'";

            var _hc = jQuery('#hc', window.parent.document).val();

            var layerLoteLogradouroSelect_wfs_options = {
                url: 'map.geo?hc=' + _hc + '&tipoServico=DWFS1',
                transparent: true,
                params: {
                    request: "GetFeature",
                    service: "wfs",
                    version: "1.0.0",
                    typeName: NM_LAYER_LOTE_WFS,
                    featureType: NM_LAYER_LOTE_WFS,
                    CQL_FILTER: cqlFilter
                },
                format: new OpenLayers.Format.GML({
                    geometryName: NM_GEOMETRIA_LOTE
                })
            };

            OpenLayers.Feature.Vector.style["select"].strokeWidth = 2;

            layerLoteLogradouroSelect = new OpenLayers.Layer.Vector("Lote_Logradouro", {
                strategies: [new OpenLayers.Strategy.Fixed()],
                protocol: new OpenLayers.Protocol.HTTP(layerLoteLogradouroSelect_wfs_options),
                styleMap: new OpenLayers.Style(OpenLayers.Feature.Vector.style["select"])
            });

            //Adicionando a camada pesquisada no mapa
            map.addLayer(layerLoteLogradouroSelect)

            layerLoteLogradouroSelect.events.register("featureadded", this, function (e) {
                var lat, lon, zoom;
                lon = layerLoteLogradouroSelect.features[0].geometry.getCentroid().x;
                lat = layerLoteLogradouroSelect.features[0].geometry.getCentroid().y;
                zoom = 9;
                var olLonLat = new OpenLayers.LonLat(lon, lat);

                //Setando a posição do mapa para o logradouro pesquisado
                //map.setCenter(olLonLat, zoom, false, false);
                map.moveTo(olLonLat, zoom);

                closeloading();

                //Fechando a popup de pesquisa
                //fechaPopup();
                document.getElementById('drag').style.display = 'none';
                //map.controls[9].panel_div.className = map.controls[9].displayClass + "ItemInactive olButton";
                globalctlBtnPesquisaLogradouro.panel_div.className = globalctlBtnPesquisaLogradouro.displayClass + "ItemInactive olButton";
                this.selectedIndex = -1;
            });

        }

    });

}

onErrorPesqEndLoteNumero = function (err) { console.log(err); }

var strPastaFiltro = "_INTER";
/*****************************************************************************************************************
* Função para filtrar lista de pastas de download de acordo com as regras:
Com <TEMA> _INTRA (visível somente no GEOSAMPA INTRANET)
Com <TEMA> _INTER (visível somente nO GEOSAMPA INTERNET)
Somente com <TEMA> sem um dos sufixos (visível nas duas aplicações)
******************************************************************************************************************/
filtraPastas = function (strPastas) {
    var arrPastas = new Array()
    arrPastas = strPastas.split("|")
    strPastas = ""
    for (i = 0; i < arrPastas.length; i++) {
        if (arrPastas[i] != "" && arrPastas[i].indexOf("_hid_") == -1) {
            //valida se tem pasta com "_INTRA" e não apresenta
            if (arrPastas[i].indexOf("_INTRA") == -1) {
                strPastas = strPastas + "|" + arrPastas[i];
            }
        }
    }
    return strPastas;
}


_downloadArquivosMensagem = function () {

    $("#mensagemDownloadArquivos").dialog({
        open: function (event, ui) {
            //hide close button.
            $(this).parent().children().children('.ui-dialog-titlebar-close').hide();
        },
        resizable: false,
        height: "auto",
        width: 310,
        modal: true,
        buttons: {
            "OK": function () {
                $(this).dialog("close");
                inativaExibeDivDownloadCamadas();
            }
        }
    });

}

_downloadArquivos = function () {

    loading(); // loading popup
    PageMethods.pesquisaSubPastas("TEMAS", onSuccessPesqPastaTemas, onErrorPesqPastaTemas);
}


onErrorPesqPastaTemas = function (desc) { console.log(desc); }
onSuccessPesqPastaTemas = function (result) {

    closeloading(); // loading popup

    jQuery('#lblDownloadCamadas').html('Escolha o tema para download');

    var arrCamadas = filtraPastas(result.toString()).split("|");
    var numCamadas = (arrCamadas.length <= 30 ? arrCamadas.length : 30);
    var cHeigth = 23;
    //var cHeigth = (parseInt(15 * numCamadas) > 0 ? parseInt(15 * numCamadas) : 15);
    if (arrCamadas.length > 0) {

        var strHTMLCombo = "<select id='cboCamadas' onChange='Javascript:pesquisaTemasCamadas(this);'>";

        for (var i = 0; i < arrCamadas.length; i++) {
            var strNomeCamada = arrCamadas[i].split(":")[0];
            strHTMLCombo += "<option value='" + strNomeCamada + "'>" + strNomeCamada.replace(strPastaFiltro, "") + "</option>";
        }
        //strHTMLCombo += "<option value='CAMADAS'>Camadas</option>";
        strHTMLCombo += "</select>";

    }


    var strHTMLDiv = "<div id='divComboCamadas' style='height:" + cHeigth + "px;'>" + strHTMLCombo + "</div>";
    //var strHTMLDiv = "<div id='divComboCamadas'>" + strHTMLCombo + "</div>";

    jQuery('#divHTMLTipo').html(strHTMLDiv);
    jQuery('#divHTMLCamadas').html('');
    jQuery('#divHTMLCamadas2').html('');
    jQuery('#divHTMLCamadas3').html('');

    jQuery('#divDownloadCamadas').show();

    //Ordena a lista
    var lista = jQuery("#cboCamadas option");
    lista.sort(function (a, b) {
        return (a.text < b.text) ? -1 : (a.text > b.text) ? 1 : 0;
    });
    jQuery(lista).remove();
    jQuery("#cboCamadas").append(jQuery(lista));
    jQuery("#cboCamadas").val("");

    //Retira as iniciais de ordenamento (ex: "01_")
    var listaCmb = jQuery("#cboCamadas option");
    for (var i = 0; i < jQuery("#cboCamadas option").length; i++) {
        if (jQuery("#cboCamadas option")[i].innerHTML !== "" && jQuery("#cboCamadas option")[i].innerHTML !== undefined) {
            jQuery("#cboCamadas option")[i].innerHTML = (jQuery("#cboCamadas option")[i].innerHTML).substr(3, (jQuery("#cboCamadas option")[i].innerHTML).length - 1);
        }

    }
}


pesquisaTemasCamadas = function (cbo) {

    str = cbo.value;


    loading();
    PageMethods.pesquisaPastas(str + '\\', onSuccessPesqPasta, onErrorPesqPasta);

}


var PastaTemasSelecionadaDownload;
listarArquivosTemas = function (pasta) {
    //console.log(pasta);
    loading(); // loading popup
    PastaTemasSelecionadaDownload = pasta;
    PageMethods.pesquisaArquivosTemas(PastaTemasSelecionadaDownload, onSuccessPesqArquivosTemas, onErrorPesqArquivosTemas);
}
onErrorPesqArquivosTemas = function (desc) { console.log(desc); }
onSuccessPesqArquivosTemas = function (result) {

    jQuery('#lblDownloadCamadas').html('Escolha o arquivo para download');

    //Prepara os elementos HTML para montagem do grid 
    var rnd = (Math.random()).toString().replace('.', '').substring(0, 5);
    var idT = '_T_' + rnd;
    var idP = '_P_' + rnd;
    var idM = '_M_' + rnd;

    var strHTMLtbl = "<table id=" + idT + "></table>";
    var strHTMLpgr = "<div id=" + idP + "></div>";
    var strHTMLifr = "<iframe id=_ifrDown name=_ifrDown width=0 height=0 border=0></iframe>";

    jQuery('#divHTMLCamadas3').html(strHTMLtbl + strHTMLpgr + strHTMLifr);

    var grid = jQuery('#' + idT);

    if (result != "") {

        var arrStrArquivos = result.toString().split("|");

        if (arrStrArquivos.length > 0) {

            var strArquivos = "[";
            for (var i = 0; i < arrStrArquivos.length; i++) {
                var arrNomeArquivo = arrStrArquivos[i].split(".");
                var strNomeArquivo = "";
                var strNomeArquivoExt = "";
                for (var j = 0; j < arrNomeArquivo.length - 1; j++) {
                    strNomeArquivo += arrNomeArquivo[j];
                }
                strNomeArquivoExt = strNomeArquivo + '.' + arrNomeArquivo[arrNomeArquivo.length - 1];
                var strLinkHTML = "<a class=down target=_ifrDown href=downloadIfr.aspx?orig=DownloadTemas&arq=" + escape(PastaTemasSelecionadaDownload + "\\\\" + strNomeArquivoExt) + "&arqTipo=" + arrNomeArquivo[arrNomeArquivo.length - 1] + ">" + strNomeArquivo + "</a>";
                strArquivos += "{ Arquivo: \"" + strLinkHTML + "\" },";
            }
            strArquivos = strArquivos.substring(0, strArquivos.length - 1);
            strArquivos += "]";
            var arrArquivos = eval(strArquivos);

            grid.jqGrid({
                datatype: "local",
                data: arrArquivos,
                height: "auto",
                colNames: ['Arquivo'],
                colModel: [{ name: 'Arquivo', index: 'Arquivo', width: '455', sortable: false }],
                multiselect: false,
                caption: "",
                pager: idP,
                rowNum: 10,
                //rowList: [10, 20, 30],
                localReader: { repeatitems: true },
                viewrecords: false,
                gridview: true,
                autowidth: false,
                ignoreCase: true,
                loadonce: false,
                loadError: function (xhr, st, err) {
                    console.log("Type: " + st + "; Response: " + xhr.status + " " + xhr.statusText);
                },
                loadComplete: function () {
                    //console.log(this);
                    closeloading();
                }
            });

        }
        else {
            if (arrStrArquivos.length > 0) {
                closeloading();
                var arrNomeArquivo = arrStrArquivos[0].split(".");
                var strNomeArquivo = "";
                var strNomeArquivoExt = "";
                for (var i = 0; i < arrNomeArquivo.length - 1; i++) {
                    strNomeArquivo += arrNomeArquivo[i];
                }
                strNomeArquivoExt = strNomeArquivo + '.' + arrNomeArquivo[arrNomeArquivo.length - 1];
                var strURL = "downloadIfr.aspx?orig=DownloadTemas&arq=" + escape(PastaTemasSelecionadaDownload + "\\\\" + strNomeArquivoExt) + "&arqTipo=" + arrNomeArquivo[arrNomeArquivo.length - 1];
                $('#_ifrDown').attr('src', strURL);
            }
        }
    }
    else {
        closeloading();
        jQuery('#' + idP).html('Não existem arquivos para o formato da camada selecionada.');
    }
    //jQuery('#toPopup').css('height', heightToPopup);
}




/*

exibeTipoDownloadArquivo = function () {

    closeloading();

    jQuery('#lblDownloadCamadas').html('Selecione o tipo para download');

    var strHTMLChecks = "<input name='tpDown' type='radio' value='V' onclick='Javascript:exibeDownloadArquivoVetorial();' /> Vetorial";
    strHTMLChecks += "&nbsp;&nbsp;<input name='tpDown' type='radio' value='I' onclick='Javascript:exibeDownloadArquivoImagem();' /> Imagem";
    var strHTMLDiv = "<div id='divTipoDownloadArquivos'>" + strHTMLChecks + "</div>";
    jQuery('#divHTMLTipo').html(strHTMLDiv);
    jQuery('#divHTMLCamadas').html('');
    jQuery('#divHTMLCamadas2').html('');
    jQuery('#divHTMLCamadas3').html('');

    jQuery('#divDownloadCamadas').show();
}

exibeDownloadArquivoImagem = function () {
    loading();

    jQuery('#lblDownloadCamadas').html('Escolha o tema para download');

    var strHTMLCombo = "<select id='cboCamadasImagem' onChange=''>";
    strHTMLCombo += "<option value=''></option>";
    strHTMLCombo += "<option value='0'>Mosaico / Ortofoto</option>";
    strHTMLCombo += "<option value='1'>Imagem Satélite</option>";
    strHTMLCombo += "<option value='2'>Planta / Mapa Histórico</option>";
    strHTMLCombo += "<option value='3'>Atlas Ambiental</option>";
    strHTMLCombo += "<option value='4'>Camadas</option>";
    strHTMLCombo += "</select>";

    var strHTMLDiv = "<div id='divComboCamadasImagem'>" + strHTMLCombo + "</div>";
    jQuery('#divHTMLCamadas').html(strHTMLDiv);
    jQuery('#divHTMLCamadas2').html('');
    jQuery('#divHTMLCamadas3').html('');

    closeloading();
}
*/

exibeDownloadArquivoVetorial = function () {
    loading();
    PageMethods.pesquisaPastas("", onSuccessPesqPasta, onErrorPesqPasta);
}

onErrorPesqPasta = function (desc) { console.log(desc); }
onSuccessPesqPasta = function (result) {

    closeloading(); // loading popup

    //Inibe a legenda
    //exibeLegenda(false);

    //inibe o formulário de pesquisa
    //jQuery('#divDownloadCamadas').show();

    jQuery('#lblDownloadCamadas').html('Escolha a camada para download');

    var arrCamadas = filtraPastas(result.toString()).split("|");
    var numCamadas = (arrCamadas.length <= 30 ? arrCamadas.length : 30);
    //var cHeigth = (parseInt(15 * numCamadas) > 0 ? parseInt(15 * numCamadas) : 15);
    if (arrCamadas.length > 0) {

        var strHTMLCombo = "<select id='cboSubCamadas' onChange='Javascript:pesquisaSubPastas(this);'>";

        for (var i = 0; i < arrCamadas.length; i++) {
            var strNomeCamada = arrCamadas[i].split(":")[0];
            var countArquivos = arrCamadas[i].split(":")[1];
            strHTMLCombo += "<option value='" + strNomeCamada + "'>" + strNomeCamada.replace(strPastaFiltro, "") + "</option>";
        }
        strHTMLCombo += "</select>";

    }
    //var strHTMLDiv = "<div id='divComboCamadas' style='height:" + cHeigth + "px;'>" + strHTMLCombo + "</div>";
    var strHTMLDiv = "<div id='divComboCamadas'>" + strHTMLCombo + "</div>";
    jQuery('#divHTMLCamadas').html(strHTMLDiv);
    jQuery('#divHTMLCamadas2').html('');
    jQuery('#divHTMLCamadas3').html('');

    //heightToPopup = jQuery('#toPopup').css('height');
    //jQuery('#toPopup').css('height', '420px');

    //Abre o popup (fancybox) com o grid
    //abrePopup();

    jQuery('#divDownloadCamadas').show();
}

var CamadaSelecionadaDownload = "";
pesquisaSubPastas = function (obj) {
    var val = obj.value;
    if (val != "") {
        loading(); // loading popup
        CamadaSelecionadaDownload = val;
        //PageMethods.pesquisaSubPastas(CamadaSelecionadaDownload, onSuccessPesqSubPastas, onErrorPesqSubPastas);
        PageMethods.pesquisaSubPastas($('#cboCamadas').val() + "\\" + CamadaSelecionadaDownload, onSuccessPesqSubPastas, onErrorPesqSubPastas);

    }
}


onErrorPesqSubPastas = function (desc) { console.log(desc); }
onSuccessPesqSubPastas = function (result) {

    jQuery('#lblDownloadCamadas').html('Escolha o formato para download');

    //Prepara os elementos HTML para montagem do grid 
    var rnd = (Math.random()).toString().replace('.', '').substring(0, 5);
    var idT = 'T_' + rnd;
    var idP = 'P_' + rnd;
    var idM = 'M_' + rnd;

    var strHTMLtbl = "<table id=" + idT + "></table>";
    var strHTMLpgr = "<div id=" + idP + "></div>";

    //jQuery('#divComboCamadas').css('height', '30px');
    jQuery('#divHTMLCamadas2').html(strHTMLtbl + strHTMLpgr);
    jQuery('#divHTMLCamadas3').html('');

    var arrPastas = result.toString().split("|");
    var LIMITE_ARQUIVOS_MENSAGEM = 96;
    var supLimite = false;

    if (arrPastas.length > 0) {
        var strLinkHTML = "";
        for (var i = 1; i < arrPastas.length; i++) {
            var strNomePasta = arrPastas[i].split(":")[0];
            var countArquivos = arrPastas[i].split(":")[1];
            strLinkHTML += "<a href=\'Javascript:void(0);\' onclick=\'Javascript:listarArquivos(this.innerHTML," + countArquivos + ");\'>" + strNomePasta + "</a>";
            if (i < arrPastas.length - 1) strLinkHTML += "&nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;&nbsp;";
            if (countArquivos >= LIMITE_ARQUIVOS_MENSAGEM) supLimite = true;
        }
        var strSubPastas = "[{ Camada: \"" + CamadaSelecionadaDownload.replace(strPastaFiltro, "") + "\", Download: \"" + strLinkHTML + "\" }]";
        var arrSubPastas = eval(strSubPastas);

        var grid = jQuery('#' + idT);

        if (supLimite) {
            if (CamadaSelecionadaDownload != 'Lotes') {

                $(function () {
                    $("#downloadPorDistrito").dialog({
                        resizable: false,
                        height: "auto",
                        width: 310,
                        modal: true,
                        buttons: {
                            "OK": function () {
                                $(this).dialog("close");
                            }
                        }
                    });
                });
            }
        }

        grid.jqGrid({
            datatype: "local",
            data: arrSubPastas,
            height: "auto",
            colNames: ['Camada', 'Download'],
            //colNames: ['Logradouro'],
            colModel: [
                   { name: 'Camada', index: 'Camada', width: '200', sortable: false, align: 'center' },
                   { name: 'Download', index: 'Download', width: '250', title: false, sortable: false, align: 'center' }
            ],
            multiselect: false,
            caption: "",
            //pager: idP,
            rowNum: 10,
            //rowList: [10, 20, 30],
            localReader: { repeatitems: true },
            viewrecords: false,
            gridview: true,
            autowidth: false,
            ignoreCase: true,
            loadonce: false,
            loadError: function (xhr, st, err) {
                console.log("Type: " + st + "; Response: " + xhr.status + " " + xhr.statusText);
            },
            loadComplete: function () {
                //console.log(this);
                closeloading();
            }
        });

    }

}

var PastaSelecionadaDownload;
var numArquivosPastaSelecionada;
listarArquivos = function (pasta, numArquivos) {
    //console.log(pasta);
    loading(); // loading popup
    PastaSelecionadaDownload = pasta;
    numArquivosPastaSelecionada = numArquivos;
    PageMethods.pesquisaArquivos($('#cboCamadas').val() + "\\" + CamadaSelecionadaDownload + "\\" + PastaSelecionadaDownload, onSuccessPesqArquivos, onErrorPesqArquivos);
    //TODO
}
onErrorPesqArquivos = function (desc) { console.log(desc); }
onSuccessPesqArquivos = function (result) {

    jQuery('#lblDownloadCamadas').html('Escolha o arquivo para download');

    //Prepara os elementos HTML para montagem do grid 
    var rnd = (Math.random()).toString().replace('.', '').substring(0, 5);
    var idT = '_T_' + rnd;
    var idP = '_P_' + rnd;
    var idM = '_M_' + rnd;

    var strHTMLtbl = "<table id=" + idT + "></table>";
    var strHTMLpgr = "<div id=" + idP + "></div>";
    var strHTMLifr = "<iframe id=_ifrDown name=_ifrDown width=0 height=0 border=0></iframe>";

    jQuery('#divHTMLCamadas3').html(strHTMLtbl + strHTMLpgr + strHTMLifr);

    var grid = jQuery('#' + idT);

    if (result != "") {

        var arrStrArquivos = result.toString().split("|");

        if (arrStrArquivos.length > 1) {

            var strArquivos = "[";
            for (var i = 0; i < arrStrArquivos.length; i++) {
                var arrNomeArquivo = arrStrArquivos[i].split(".");
                var strNomeArquivo = "";
                for (var j = 0; j < arrNomeArquivo.length - 1; j++) {
                    strNomeArquivo += arrNomeArquivo[j];
                }
                if (CamadaSelecionadaDownload == 'Lotes') {
                    var strLinkHTML = "<a class=down href=javascript:downloadLotes('" + CamadaSelecionadaDownload + "','" + PastaSelecionadaDownload + "','" + strNomeArquivo + "');>" + strNomeArquivo + "</a>";
                }
                else if (CamadaSelecionadaDownload == 'Area_Risco_Hidrologico') {
                    var strLinkHTML = "<a class=down href=javascript:downloadRiscoHidrologico('" + CamadaSelecionadaDownload + "','" + PastaSelecionadaDownload + "','" + strNomeArquivo + "');>" + strNomeArquivo + "</a>";
                }
                else if (CamadaSelecionadaDownload.indexOf('Lei13885') > -1) {
                    var strLinkHTML = "<a class=down href=javascript:downloadZoneamentoRevogado('" + CamadaSelecionadaDownload + "','" + PastaSelecionadaDownload + "','" + strNomeArquivo + "');>" + strNomeArquivo + "</a>";
                }
                else {
                    var strLinkHTML = "<a class=down target=_ifrDown href=downloadIfr.aspx?orig=DownloadCamadas&arq=" + escape($('#cboCamadas').val() + "\\\\" + CamadaSelecionadaDownload + "\\\\" + PastaSelecionadaDownload + "\\\\" + strNomeArquivo) + "&arqTipo=" + PastaSelecionadaDownload + ">" + strNomeArquivo + "</a>";
                }
                strArquivos += "{ Arquivo: \"" + strLinkHTML + "\" },";
            }
            strArquivos = strArquivos.substring(0, strArquivos.length - 1);
            strArquivos += "]";
            var arrArquivos = eval(strArquivos);

            grid.jqGrid({
                datatype: "local",
                data: arrArquivos,
                height: "auto",
                colNames: ['Arquivo'],
                colModel: [{ name: 'Arquivo', index: 'Arquivo', width: '455', sortable: false }],
                multiselect: false,
                caption: "",
                pager: idP,
                rowNum: 08,
                //rowList: [10, 20, 30],
                localReader: { repeatitems: true },
                viewrecords: false,
                gridview: true,
                autowidth: false,
                ignoreCase: true,
                loadonce: false,
                loadError: function (xhr, st, err) {
                    console.log("Type: " + st + "; Response: " + xhr.status + " " + xhr.statusText);
                },
                loadComplete: function () {
                    //console.log(this);
                    closeloading();
                }
            });

        }
        else {
            if (arrStrArquivos.length > 0) {
                closeloading();
                var arrNomeArquivo = arrStrArquivos[0].split(".");
                var strNomeArquivo = "";
                for (var i = 0; i < arrNomeArquivo.length - 1; i++) {
                    strNomeArquivo += arrNomeArquivo[i];
                }
                if (CamadaSelecionadaDownload.indexOf('Lei13885') > -1) {
                    $("#downloadZoneamentoRevogado").dialog({
                        open: function (event, ui) {
                            //hide close button.
                            $(this).parent().children().children('.ui-dialog-titlebar-close').hide();
                        },
                        resizable: false,
                        height: "auto",
                        width: 310,
                        modal: true,
                        buttons: {
                            "De acordo": function () {
                                var strURL = "downloadIfr.aspx?orig=DownloadCamadas&arq=" + escape($('#cboCamadas').val() + "\\\\" + CamadaSelecionadaDownload + "\\\\" + PastaSelecionadaDownload + "\\\\" + strNomeArquivo) + "&arqTipo=" + PastaSelecionadaDownload;
                                $('#_ifrDown').attr('src', strURL);
                                $(this).dialog("close");
                            }
                        }
                    });

                } else {
                    var strURL = "downloadIfr.aspx?orig=DownloadCamadas&arq=" + escape($('#cboCamadas').val() + "\\\\" + CamadaSelecionadaDownload + "\\\\" + PastaSelecionadaDownload + "\\\\" + strNomeArquivo) + "&arqTipo=" + PastaSelecionadaDownload;
                    $('#_ifrDown').attr('src', strURL);
                }
            }
        }
    }
    else {
        closeloading();
        jQuery('#' + idP).html('Não existem arquivos para o formato da camada selecionada.');
    }
    //jQuery('#toPopup').css('height', heightToPopup);
}






/********************************************************
Nome: mudaEscala()
Objetivo: Captura as possíveis escalas do mapa e efetua o zoom pela escala selecionada
Parâmetro(s): idx - índice do array de escalas
Disparador(es): evento "onchange" do combo "cboEscala" criado na função _exibePopupZoomEscala
    
* A função original chamada pelo controle do mapa foi inibida e criada uma nova logo abaixo que será executada pela lista
que está em uma div fora do mapa
**********************************************************/

mudaEscala = function (idx) {
    //var arrEscalas = map.resolutions.map(function (resolucao) { return OpenLayers.Util.getScaleFromResolution(resolucao, 'm') });
    /*
    var arrEscalas = new Array(); //map.resolutions; //.map(function(resolucao) { return OpenLayers.Util.getScaleFromResolution(resolucao, 'm') });
    for (var i = 0; i < map.resolutions.length; i++) {
    arrEscalas[i] = parseInt(OpenLayers.Util.getScaleFromResolution(map.resolutions[i], 'm'));
    }

    map.zoomToScale(arrEscalas[idx], true);
    */
    var _escala = idx;
    if (!isNaN(_escala)) {
        map.zoomToScale(_escala);
    }
}

/*********************************************************
Nome: aplicaConfigEscala
Objetivo: aplica a configuração definidas na janela de config
**********************************************************/
aplicaConfigEscala = function () {
    var chkEscala = document.getElementById("ChkEscala");

    if (chkEscala.checked == true) {
        globalScaleLine.activate();
        document.getElementById("divEscalaLine").style.display = "block";
        $("#divContornoEscalas").css("width", 250);
        $("#divImgNorte").css("left", 262);
    } else {
        globalScaleLine.deactivate();
        document.getElementById("divEscalaLine").style.display = "none";
        $("#divContornoEscalas").css("width", 160);
        $("#divImgNorte").css("left", 165);
    }
}


/*********************************************************
Nome: aplicaConfigMousePos
Objetivo: aplica a configuração definidas na janela de config
**********************************************************/
aplicaConfigMousePos = function () {
    var chkMousePosition = document.getElementById("ChkMousePosition");
    //var cboUnidadeMouse = document.getElementById("cboUnidadeMouse");

    if (chkMousePosition.checked == true) {
        globalMousePosition.activate();
        document.getElementById("divContornoMousePosition").style.display = "block";
    } else {
        globalMousePosition.deactivate();
        document.getElementById("divContornoMousePosition").style.display = "none";
    }

    /*
    if (cboUnidadeMouse.value == 1) {
    $("li").css("color", "red");
    } else {
    alert('2');
    }
    */

}


/*********************************************************
Nome: aplicaConfigUnidMouse
Objetivo: aplica a configuração definidas na janela de config
**********************************************************/
aplicaConfigUnidMouse = function () {
    var cboUnidadeMouse = document.getElementById("cboUnidadeMouse");

    var projectionA = new OpenLayers.Projection("EPSG:4618");  //lat lon  numeros pequenos 23 a 76
    //var projectionB = new OpenLayers.Projection("EPSG:29193"); //sad 169 padrao x,y  acima de 1000
    var projectionB = new OpenLayers.Projection("EPSG:31983");

    if (cboUnidadeMouse.value == 1) {
        //map.displayProjection = projectionA;
        globalMousePosition.displayProjection = projectionA;

        var wformatOutput = function (lonLat) {
            var digits = parseInt(this.numDigits);
            var newHtml =
						this.prefix +
						OpenLayers.Util.getFormattedLonLat(lonLat.lat, 'lat', 'dms') +
						this.separator +
						OpenLayers.Util.getFormattedLonLat(lonLat.lon, 'lon', 'dms') +
						this.suffix;
            return newHtml;
        };
        globalMousePosition.formatOutput = wformatOutput;

    } else {
        //map.displayProjection = projectionB;
        globalMousePosition.displayProjection = projectionB;
        globalMousePosition.formatOutput = globalFormatOutput;
    }


}



/*********************************************************
Nome: handler de click no control
Objetivo: ativa handler de click em controle
**********************************************************/
OpenLayers.Control.Click = OpenLayers.Class(OpenLayers.Control, {
    defaultHandlerOptions: {
        'single': true,
        'double': false,
        'pixelTolerance': 0,
        'stopSingle': false,
        'stopDouble': false
    },

    initialize: function (options) {
        this.handlerOptions = OpenLayers.Util.extend(
                        {}, this.defaultHandlerOptions
                    );
        OpenLayers.Control.prototype.initialize.apply(
                        this, arguments
                    );
        this.handler = new OpenLayers.Handler.Click(
                        this, {
                            'click': this.onClick,
                            'dblclick': this.onDblclick
                        }, this.handlerOptions
                    );
    },

    onClick: function (evt) {
        resetaInfoPesq();

        lonLatSelecao = map.getLonLatFromPixel(evt.xy);

        listaFeicoesAtivasClicadas();   //ainda para testes

        //_showInfo();
        showInfoFlutuante();

    }
});


var layerSetorSelect;
pesquisaSetor = function () {

    loading();

    //var intSetor = parseInt($('#txtSetorPesquisa').val(), 10);
    //var nrSetor = $('#txtSetorPesquisa').val();
    var intSetor = parseInt($('#txtSetorLote').val(), 10);
    var nrSetor = $('#txtSetorLote').val();

    if (intSetor < 1 || intSetor > 310) {
        jAlert('Para pesquisa por setor os valores válidos estão entre 001 e 310.', 'Mensagem', function () { });
        closeloading();
        return false;
    }

    if (intSetor == 92) {
        jAlert('O setor pesquisado não existe.', 'Mensagem', function () { });
        closeloading();
        return false;
    }

    //Reseta o mapa
    _limpaSelecao();

    //Montagem da string de filtro CQL
    var cqlFilter = "cd_setor_fiscal = '" + nrSetor + "'";

    var _hc = jQuery('#hc', window.parent.document).val();

    var layerSetorSelect_wfs_options = {
        url: 'map.geo?hc=' + _hc + '&tipoServico=DWFS1',
        transparent: true,
        params: {
            request: "GetFeature",
            service: "wfs",
            version: "1.0.0",
            typeName: NM_LAYER_SETOR_PESQUISA_WFS,
            featureType: NM_LAYER_SETOR_PESQUISA_WFS,
            CQL_FILTER: cqlFilter
        },
        format: new OpenLayers.Format.GML({
            geometryName: NM_GEOMETRIA_SETOR
        })
    };

    OpenLayers.Feature.Vector.style["select"].strokeWidth = 2;

    layerSetorSelect = new OpenLayers.Layer.Vector("Setor", {
        strategies: [new OpenLayers.Strategy.Fixed()],
        protocol: new OpenLayers.Protocol.HTTP(layerSetorSelect_wfs_options),
        styleMap: new OpenLayers.Style(OpenLayers.Feature.Vector.style["select"])
    });



    //Adicionando a camada do logradouro pesquisado no mapa
    map.addLayer(layerSetorSelect)


    layerSetorSelect.events.register("featureadded", this, function (e) {
        var lat, lon, zoom;
        lon = layerSetorSelect.features[0].geometry.getCentroid().x;
        lat = layerSetorSelect.features[0].geometry.getCentroid().y;
        zoom = 5;
        var olLonLat = new OpenLayers.LonLat(lon, lat);

        //Setando a posição do mapa para o logradouro pesquisado
        //map.setCenter(olLonLat, zoom, false, false);
        map.moveTo(olLonLat, zoom);

        closeloading();

        //Fechando a popup de pesquisa
        //fechaPopup();
        //document.getElementById('drag').style.display = 'none';
        //map.controls[9].panel_div.className = map.controls[9].displayClass + "ItemInactive olButton";
        //globalctlBtnPesquisaLogradouro.panel_div.className = globalctlBtnPesquisaLogradouro.displayClass + "ItemInactive olButton";
    });

}


var layerSubprefeituraSelect;
carregaListaSubprefeitura = function () {

    var _hc = jQuery('#hc', window.parent.document).val();

    //Criando opções de para o controle do tipo "OpenLayers.Control.GetFeature"
    var wfsSubs_options = {
        request: "GetFeature",
        service: "wfs",
        version: "1.0.0",
        typeName: NM_LAYER_SUBPREFEITURAS_WFS,
        outputFormat: 'json',
        propertyName: 'nm_subprefeitura',
        sortBy: 'nm_subprefeitura'
    };

    jQuery.ajax({
        url: 'map.geo?hc=' + _hc + '&tipoServico=DWFS1',
        data: wfsSubs_options,
        dataType: 'json',
        success: function (res) {
            //console.log(res);
            var arrFeaturesJson = res.features;
            if (arrFeaturesJson != undefined && arrFeaturesJson != []) {
                for (var i = 0; i < arrFeaturesJson.length; i++) {
                    var sub = arrFeaturesJson[i];
                    //console.log(sub.properties['FEATID'] + ' - ' + sub.properties['COD_SUBPREFEITURA'] + ' - ' + sub.properties['NOME']);
                    //jQuery('#lstSubprefeitura').append('<option value="' + sub.properties['FEATID'] + '">' + sub.properties['NOME'] + '</option>');
                    jQuery('#lstSubprefeitura').append('<option value="' + sub.properties['cd_identificador_subprefeitura'] + '">' + sub.properties['nm_subprefeitura'] + '</option>');
                    //carrega também o combo da aba integração
                    jQuery('#cboSubIntegracao').append('<option value="' + sub.properties['cd_identificador_subprefeitura'] + '" cd_subprefeitura="' + sub.properties['cd_subprefeitura'] + '">' + sub.properties['nm_subprefeitura'] + '</option>');

                }
            }
        }
    });

    jQuery('#lstSubprefeitura').change(function () {
        //console.log(this.value);

        var featid = this.value;

        if (parseInt(featid) > 0) {

            loading();

            //Reseta o mapa
            _limpaSelecao();

            //Montagem da string de filtro CQL
            var cqlFilter = "cd_identificador_subprefeitura = '" + featid + "'";

            var _hc = jQuery('#hc', window.parent.document).val();

            var layerSubprefeituraSelect_wfs_options = {
                url: 'map.geo?hc=' + _hc + '&tipoServico=DWFS1',
                transparent: true,
                params: {
                    request: "GetFeature",
                    service: "wfs",
                    version: "1.0.0",
                    typeName: NM_LAYER_SUBPREFEITURAS_WFS,
                    featureType: NM_LAYER_SUBPREFEITURAS_WFS,
                    CQL_FILTER: cqlFilter
                },
                format: new OpenLayers.Format.GML({
                    geometryName: NM_GEOMETRIA_SUBPREFEITURA
                })
            };

            OpenLayers.Feature.Vector.style["select"].strokeWidth = 2;

            layerSubprefeituraSelect = new OpenLayers.Layer.Vector("Subprefeitura", {
                strategies: [new OpenLayers.Strategy.Fixed()],
                protocol: new OpenLayers.Protocol.HTTP(layerSubprefeituraSelect_wfs_options),
                styleMap: new OpenLayers.Style(OpenLayers.Feature.Vector.style["select"])
            });

            //Adicionando a camada da subprefeitura pesquisada no mapa
            map.addLayer(layerSubprefeituraSelect)

            layerSubprefeituraSelect.events.register("featureadded", this, function (e) {
                var lat, lon, zoom;
                lon = layerSubprefeituraSelect.features[0].geometry.getCentroid().x;
                lat = layerSubprefeituraSelect.features[0].geometry.getCentroid().y;
                zoom = 3;
                var olLonLat = new OpenLayers.LonLat(lon, lat);

                //Setando a posição do mapa para o logradouro pesquisado
                //map.setCenter(olLonLat, zoom, false, false);
                map.moveTo(olLonLat, zoom);

                closeloading();

                //Fechando a popup de pesquisa
                //fechaPopup();
                document.getElementById('drag').style.display = 'none';
                //map.controls[9].panel_div.className = map.controls[9].displayClass + "ItemInactive olButton";
                globalctlBtnPesquisaLogradouro.panel_div.className = globalctlBtnPesquisaLogradouro.displayClass + "ItemInactive olButton";
                this.selectedIndex = -1;
            });

        }

    });

}



var layerDistritoSelect;
carregaListaDistrito = function () {

    var _hc = jQuery('#hc', window.parent.document).val();

    //Criando opções de para o controle do tipo "OpenLayers.Control.GetFeature"
    var wfsDistrito_options = {
        request: "GetFeature",
        service: "wfs",
        version: "1.0.0",
        typeName: NM_LAYER_DISTRITO_WFS,
        outputFormat: 'json',
        propertyName: 'nm_distrito_municipal,cd_identificador_distrito',
        sortBy: 'nm_distrito_municipal'
    };

    jQuery.ajax({
        url: 'map.geo?hc=' + _hc + '&tipoServico=DWFS1',
        data: wfsDistrito_options,
        dataType: 'json',
        success: function (res) {
            //console.log(res);
            var arrFeaturesJson = res.features;
            if (arrFeaturesJson != undefined && arrFeaturesJson != []) {
                for (var i = 0; i < arrFeaturesJson.length; i++) {
                    var sub = arrFeaturesJson[i];
                    //console.log(sub.properties['FEATID'] + ' - ' + sub.properties['COD_SUBPREFEITURA'] + ' - ' + sub.properties['NOME_DISTRITO']);
                    jQuery('#lstDistrito').append('<option value="' + sub.properties['cd_identificador_distrito'] + '">' + sub.properties['nm_distrito_municipal'] + '</option>');
                }
            }
        }
    });

    jQuery('#lstDistrito').change(function () {
        //console.log(this.value);

        var featid = this.value;

        if (parseInt(featid) > 0) {

            loading();

            //Reseta o mapa
            _limpaSelecao();

            //Montagem da string de filtro CQL
            var cqlFilter = "cd_identificador_distrito = '" + featid + "'";

            var _hc = jQuery('#hc', window.parent.document).val();

            var layerDistritoSelect_wfs_options = {
                url: 'map.geo?hc=' + _hc + '&tipoServico=DWFS1',
                transparent: true,
                params: {
                    request: "GetFeature",
                    service: "wfs",
                    version: "1.0.0",
                    typeName: NM_LAYER_DISTRITO_WFS,
                    featureType: NM_LAYER_DISTRITO_WFS,
                    CQL_FILTER: cqlFilter
                },
                format: new OpenLayers.Format.GML({
                    geometryName: NM_GEOMETRIA_DISTRITO
                })
            };

            OpenLayers.Feature.Vector.style["select"].strokeWidth = 2;

            layerDistritoSelect = new OpenLayers.Layer.Vector("Subprefeitura", {
                strategies: [new OpenLayers.Strategy.Fixed()],
                protocol: new OpenLayers.Protocol.HTTP(layerDistritoSelect_wfs_options),
                styleMap: new OpenLayers.Style(OpenLayers.Feature.Vector.style["select"])
            });

            //Adicionando a camada da subprefeitura pesquisada no mapa
            map.addLayer(layerDistritoSelect)

            layerDistritoSelect.events.register("featureadded", this, function (e) {
                var lat, lon, zoom;
                lon = layerDistritoSelect.features[0].geometry.getCentroid().x;
                lat = layerDistritoSelect.features[0].geometry.getCentroid().y;
                zoom = 3;
                var olLonLat = new OpenLayers.LonLat(lon, lat);

                //Setando a posição do mapa para o logradouro pesquisado
                //map.setCenter(olLonLat, zoom, false, false);
                map.moveTo(olLonLat, zoom);

                closeloading();

                //Fechando a popup de pesquisa
                //fechaPopup();
                document.getElementById('drag').style.display = 'none';
                //map.controls[9].panel_div.className = map.controls[9].displayClass + "ItemInactive olButton";
                globalctlBtnPesquisaLogradouro.panel_div.className = globalctlBtnPesquisaLogradouro.displayClass + "ItemInactive olButton";
                this.selectedIndex = -1;
            });

        }

    });

}

onSuccessPilarAutoComplete = function (res) {

    var tipoMarco = $("#cboTipoMarcoApoio").val();
    var arrMarcos;

    if (tipoMarco === 'Marco') {
        // Se for "Marco", mantém todos os elementos
        arrMarcos = res;
    } else {
        // Caso contrário, filtra conforme o nao do apoio terrestre
        var anoLevantamento = tipoMarco.slice(-4);
        arrMarcos = res.filter(function (item) {
            return item.DATA_LEVANTAMENTO &&
                item.DATA_LEVANTAMENTO.toString().endsWith(anoLevantamento);
        });
    }

    // Limpa opções anteriores (exceto a com value="0")
    $('#lstPilarMarco option[value!="0"]').remove();

    // Popula o select com os resultados filtrados (ou todos)
    for (var i = 0; i < arrMarcos.length; i++) {
        $("#lstPilarMarco").append(
            '<option value="' + arrMarcos[i]['FEATID_MARCO'] + '">' +
            arrMarcos[i]['NOME_MARCO'] + '</option>'
        );
    }
}

onErrorPilarAutoComplete = function (desc) { console.log(desc); }

var layerMarcoSelect;
var layerApoioSelect;
montaPilarAutoComplete = function () {


    if ($("#cboTipoMarcoApoio").val() == "Marco") {

        $("#txtPilarMarco").keyup(function () {
            if (this.value.length >= 2) {
                PageMethods.pesquisaPilarMarcoApoioAutoComplete($("#cboTipoMarcoApoio").val(), $("#txtPilarMarco").val(), onSuccessPilarAutoComplete, onErrorPilarAutoComplete);
            }
            else {
                $('#lstPilarMarco option[value!="0"]').remove();
            }
        });

    }
    else {

        $("#txtPilarMarco").keyup(function () {
            if (this.value.length >= 2) {
                PageMethods.pesquisaPilarMarcoApoioAutoComplete($("#cboTipoMarcoApoio").val(), $("#txtPilarMarco").val(), onSuccessPilarAutoComplete, onErrorPilarAutoComplete);
            }
            else {
                $('#lstApoioTerrestre option[value!="0"]').remove();
            }
        });

    }




    $("#lstPilarMarco").change(function () {

        if ($("#cboTipoMarcoApoio").val() == "Marco") {

            var featid = this.value;

            if (parseInt(featid) > 0) {

                loading();

                //Reseta o mapa
                _limpaSelecao();

                //Montagem da string de filtro CQL
                var cqlFilter = "cd_identificador_marco_geodesico = '" + featid + "'";

                var _hc = jQuery('#hc', window.parent.document).val();

                var layerMarcoSelect_wfs_options = {
                    url: 'map.geo?hc=' + _hc + '&tipoServico=DWFS1',
                    transparent: true,
                    params: {
                        request: "GetFeature",
                        service: "wfs",
                        version: "1.0.0",
                        typeName: NM_LAYER_MARCO_WFS,
                        featureType: NM_LAYER_MARCO_WFS,
                        CQL_FILTER: cqlFilter
                    },
                    format: new OpenLayers.Format.GML({
                        geometryName: NM_GEOMETRIA_MARCO
                    })
                };

                OpenLayers.Feature.Vector.style["select"].strokeWidth = 2;

                layerMarcoSelect = new OpenLayers.Layer.Vector("Marco", {
                    strategies: [new OpenLayers.Strategy.Fixed()],
                    protocol: new OpenLayers.Protocol.HTTP(layerMarcoSelect_wfs_options),
                    styleMap: new OpenLayers.Style(OpenLayers.Feature.Vector.style["select"])
                });

                //Adicionando a camada da subprefeitura pesquisada no mapa
                map.addLayer(layerMarcoSelect);

                layerMarcoSelect.events.register("featureadded", this, function (e) {
                    var lat, lon, zoom;
                    lon = layerMarcoSelect.features[0].geometry.getCentroid().x;
                    lat = layerMarcoSelect.features[0].geometry.getCentroid().y;
                    zoom = 8;
                    var olLonLat = new OpenLayers.LonLat(lon, lat);

                    //Setando a posição do mapa para o logradouro pesquisado
                    //map.setCenter(olLonLat, zoom, false, false);
                    map.moveTo(olLonLat, zoom);

                    closeloading();

                    //Fechando a popup de pesquisa
                    //fechaPopup();
                    document.getElementById('drag').style.display = 'none';
                    //map.controls[9].panel_div.className = map.controls[9].displayClass + "ItemInactive olButton";
                    globalctlBtnPesquisaLogradouro.panel_div.className = globalctlBtnPesquisaLogradouro.displayClass + "ItemInactive olButton";
                    this.selectedIndex = -1;
                });

                layerMarcoSelect.events.register("featureclick", this, function (e) {


                    var nmMarco = layerMarcoSelect.features[0].attributes['nm_marco'];
                    downloadMarcoGeodesico($("#cboTipoMarcoApoio").val(), nmMarco);

                });

            }

        }

        else {

            if ($("#cboTipoMarcoApoio").val() == 'Apoio2017') {
                NM_LAYER_APOIO_TERRESTRE_WFS = 'apoio_terrestre_2017';
            }
            else {
                NM_LAYER_APOIO_TERRESTRE_WFS = 'apoio_terrestre_2020';
            }

            var featid = this.value;

            if (parseInt(featid) > 0) {

                loading();

                //Reseta o mapa
                _limpaSelecao();

                //Montagem da string de filtro CQL
                var cqlFilter = "cd_identificador = '" + featid + "'";

                var _hc = jQuery('#hc', window.parent.document).val();

                var layerApoioSelect_wfs_options = {
                    url: 'map.geo?hc=' + _hc + '&tipoServico=DWFS1',
                    transparent: true,
                    params: {
                        request: "GetFeature",
                        service: "wfs",
                        version: "1.0.0",
                        typeName: NM_LAYER_APOIO_TERRESTRE_WFS,
                        featureType: NM_LAYER_APOIO_TERRESTRE_WFS,
                        CQL_FILTER: cqlFilter
                    },
                    format: new OpenLayers.Format.GML({
                        geometryName: NM_GEOMETRIA_APOIO_TERRESTRE
                    })
                };

                OpenLayers.Feature.Vector.style["select"].strokeWidth = 2;

                layerApoioSelect = new OpenLayers.Layer.Vector("Apoio", {
                    strategies: [new OpenLayers.Strategy.Fixed()],
                    protocol: new OpenLayers.Protocol.HTTP(layerApoioSelect_wfs_options),
                    styleMap: new OpenLayers.Style(OpenLayers.Feature.Vector.style["select"])
                });

                //Adicionando a camada da subprefeitura pesquisada no mapa
                map.addLayer(layerApoioSelect);

                layerApoioSelect.events.register("featureadded", this, function (e) {
                    var lat, lon, zoom;
                    lon = layerApoioSelect.features[0].geometry.getCentroid().x;
                    lat = layerApoioSelect.features[0].geometry.getCentroid().y;
                    zoom = 8;
                    var olLonLat = new OpenLayers.LonLat(lon, lat);

                    //Setando a posição do mapa para o logradouro pesquisado
                    //map.setCenter(olLonLat, zoom, false, false);
                    map.moveTo(olLonLat, zoom);

                    closeloading();

                    //Fechando a popup de pesquisa
                    //fechaPopup();
                    document.getElementById('drag').style.display = 'none';
                    //map.controls[9].panel_div.className = map.controls[9].displayClass + "ItemInactive olButton";
                    globalctlBtnPesquisaLogradouro.panel_div.className = globalctlBtnPesquisaLogradouro.displayClass + "ItemInactive olButton";
                    this.selectedIndex = -1;
                });

                layerApoioSelect.events.register("featureclick", this, function (e) {


                    var nmMarco = layerApoioSelect.features[0].attributes['cd_apoio_campo'];
                    downloadMarcoGeodesico($("#cboTipoMarcoApoio").val(), nmMarco);

                });

            }

        }

    });

}


onErroPesqMarcoGeo = function (desc) {
    alert(desc);
};
onSuccessPesqMarcoGeo = function (res) {
    alert(res);
};


mudaTipoMarcoApoio = function () {
    $("#txtPilarMarco").val('');
    $('#lstPilarMarco option[value!="0"]').remove();
}


limpaPesquisaMarco = function () {
    $("#txtPilarMarco").val('');
    $('#lstPilarMarco option[value!="0"]').remove();
}

//===========================================================================================================================
//===========================================================================================================================
//===========================================================================================================================



onSuccessQuadriculaAutoComplete = function (res) {

    var arrQuadriculas = res;
    $('#lstQuadricula option[value!="0"]').remove();
    for (var i = 0; i < arrQuadriculas.length; i++) {
        $("#lstQuadricula").append('<option value="' + arrQuadriculas[i].CdLevantamento + '|' + arrQuadriculas[i].CdIdentificadorQuadricula + '">' + arrQuadriculas[i].CdQuadricula + '</option>')
    }

}

onErrorQuadriculaAutoComplete = function (desc) { console.log(desc); }

var layerQuadriculaSelect;

/*
Os tipos estão relacionados com mais de uma camada no WFS, por isso esse array de camadas foi criado
para relacionar os tipos do combo com as camadas no serviço. (DE-PARA)
OBS.: A ORDEM DO COMBO "cboTipoMapaArticulado" DEVE SER A MESMA DOS OBJETOS NO ARRAY, POIS OS VALORES DAS OPÇÕES NO COMBO SÃO OS 
ÍNDICES NO ARRAY.
*/
var arrCamadas = [
{
    'id': 0, // ITEM VAZIO DO COMBO
    'Camadas': [],
    'Levantamentos': [],
    'Escalas': [],
    'Pasta': '',
    'PadraoArquivo': ''
},
{
    'id': 1, // SARA Brasil 1930 
    'Camadas': ['geoportal:quadricula_SARA_1930'],
    //'Camadas': ['geoportal:quadricula_SARA_1930_E2000', 'geoportal:quadricula_SARA_1930_E20000', 'geoportal:quadricula_SARA_1930_E5000'],
    'Levantamentos': [7, 8, 9],
    'Escalas': ['1:2000', '1:20000', '1:5000'],
    'Pasta': 'SARA_BRASIL_1930',
    'PadraoArquivo': '$$$.zip'
},
{
    'id': 2, // VASP Cruzeiro 1954
    'Camadas': ['geoportal:quadricula_vasp_cruzeiro'],
    //'Camadas': [],
    'Levantamentos': [16],
    'Escalas': [''],
    'Pasta': 'VASP_CRUZEIRO_1954',
    'PadraoArquivo': '$$$.tif'
},
{
    'id': 3, // Fotos Aéreas de 1940
    'Camadas': ['geoportal:quadricula_foto_aerea_1940_v2'],
    //'Camadas': [],
    'Levantamentos': [1],
    'Escalas': [''],
    'Pasta': 'FOTOS_AEREAS_1940',
    'PadraoArquivo': '$$$.jpg'
},
{
    'id': 4, // Fotos Aéreas de 1954
    'Camadas': ['geoportal:quadricula_foto_aerea_1954_v2'],
    //'Camadas': [],
    'Levantamentos': [2],
    'Escalas': [''],
    'Pasta': 'FOTOS_AEREAS_1954',
    'PadraoArquivo': '$$$.jpg'
},
{
    'id': 5, // Fotos Aéreas de 2000
    'Camadas': ['geoportal:quadricula_foto_aerea_2000_v2'],
    //'Camadas': [],
    'Levantamentos': [3],
    'Escalas': ['1:6000'],
    'Pasta': 'FOTOS_AEREAS_2000',
    'PadraoArquivo': '$$$.jpg'
},
{
    'id': 6, // Fotos Aéreas de 2001
    'Camadas': ['geoportal:quadricula_foto_aerea_2001_v2'],
    //'Camadas': [],
    'Levantamentos': [4],
    'Escalas': ['1:5000'],
    'Pasta': 'FOTOS_AEREAS_2001',
    'PadraoArquivo': '$$$.jpg'
},
{
    'id': 7, // Fotos Aéreas de 2004
    'Camadas': ['geoportal:quadricula_foto_aerea_2004'],
    //'Camadas': [],
    'Levantamentos': [5, 6],
    'Escalas': ['1:5000', '1:20000'],
    'Pasta': 'FOTOS_AEREAS_2004',
    'PadraoArquivo': '$$$.jpg'
},
{
    'id': 8, // Fotos Aéreas de 2017
    'Camadas': ['geoportal:quadricula_foto_aerea_2017'],
    //'Camadas': [],
    'Levantamentos': [28],
    'Escalas': [''],
    'Pasta': 'FOTOS_AEREAS_2017',
    'PadraoArquivo': '$$$.zip'
},
{
    'id': 9, // Ortofotos 2001
    'Camadas': ['geoportal:quadricula_orto_2001_emplasa_v2'],
    //'Camadas': [],
    'Levantamentos': [15],
    'Escalas': ['1:25000'],
    'Pasta': 'ORTOFOTOS_2001',
    'PadraoArquivo': '$$$_orto.zip'
},
{
    'id': 10, // Ortofotos 2004
    'Camadas': ['geoportal:quadricula_orto_2004'],
    //'Camadas': ['geoportal:quadricula_orto_2004_E1000', 'geoportal:quadricula_orto_2004_E5000'],
    'Levantamentos': [11, 12],
    'Escalas': ['1:1000', '1:5000'],
    'Pasta': 'ORTOFOTOS_2004',
    'PadraoArquivo': '$$$.zip'
},
{
    'id': 11, // Ortofotos 2017 RGB
    'Camadas': ['geoportal:quadricula_orto_2017'],
    //'Camadas': ['geoportal:quadricula_orto_2004_E1000', 'geoportal:quadricula_orto_2004_E5000'],
    'Levantamentos': [20, 21],
    'Escalas': ['1:1000', '1:5000'],
    'Pasta': 'ORTOFOTOS_2017_RGB',
    'PadraoArquivo': '$$$.zip'
},
{
    'id': 12, // Ortofotos 2017 IrGB
    'Camadas': ['geoportal:quadricula_orto_2017'],
    //'Camadas': ['geoportal:quadricula_orto_2004_E1000', 'geoportal:quadricula_orto_2004_E5000'],
    'Levantamentos': [20, 21],
    'Escalas': ['1:1000', '1:5000'],
    'Pasta': 'ORTOFOTOS_2017_IrGB',
    'PadraoArquivo': '$$$.zip'
},
{
    'id': 13, // Folhas vegetação significativa publicacao 1988
    'Camadas': ['geoportal:quadricula_vegetacao_E10000_v2'],
    //'Camadas': [],
    'Levantamentos': [10],
    'Escalas': ['1:10000'],
    'Pasta': 'VEGETACAO_SIGNIFICATIVA_PUBLICACAO_1988',
    'PadraoArquivo': '$$$.zip'
},
{
    'id': 14, // Cartas vegetação significativa mapeamento 1985
    'Camadas': ['geoportal:quadricula_carta_vegetacao_1985'],
    //'Camadas': [],
    'Levantamentos': [17, 18, 19],
    'Escalas': ['1:5000', '1:10000', '1:20000'],
    'Pasta': 'VEGETACAO_SIGNIFICATIVA_MAPEAMENTO_1985',
    'PadraoArquivo': '$$$.zip'
},
{
    'id': 15, // Folhas SCM
    'Camadas': ['geoportal:quadricula_orto_2004'],
    //'Camadas': [],
    'Levantamentos': [11, 12],
    'Escalas': ['1:10000', '1:5000'],
    'Pasta': 'FOLHAS_SCM',
    'PadraoArquivo': '$$$.xxx'
},
{
    'id': 16, // MDT
    'Camadas': ['geoportal:quadricula_folha_mdt'],
    //'Camadas': [],
    'Levantamentos': [29],
    'Escalas': [''],
    'Pasta': 'MDT_2017',
    'PadraoArquivo': '$$$.zip'
},
{
    'id': 17, // MDS
    'Camadas': ['geoportal:quadricula_folha_mds'],
    //'Camadas': [],
    'Levantamentos': [31],
    'Escalas': [''],
    'Pasta': 'MDS_2017',
    'PadraoArquivo': '$$$.laz'
},
{
    'id': 18, // Fotos Aéreas 1996/1994
    'Camadas': ['geoportal:quadricula_foto_aerea_1996_1994'],
    //'Camadas': [],
    'Levantamentos': [37],
    'Escalas': [''],
    'Pasta': 'FOTOS_AEREAS_1996_1994',
    'PadraoArquivo': '$$$.zip'
},
{
    'id': 19, // Ortofotos 2020 RGB
    'Camadas': ['geoportal:quadricula_orto_2020'],
    'Levantamentos': [32, 34],
    'Escalas': ['1:1000', '1:5000'],
    'Pasta': 'ORTOFOTOS_2020_RGB',
    'PadraoArquivo': '$$$.zip'
},
{
    'id': 20, // Ortofotos 2020 IrGB
    'Camadas': ['geoportal:quadricula_orto_2020'],
    'Levantamentos': [32, 34],
    'Escalas': ['1:1000', '1:5000'],
    'Pasta': 'ORTOFOTOS_2020_IrGB',
    'PadraoArquivo': '$$$.zip'
},
{
    'id': 21, // MDT 2020
    'Camadas': ['geoportal:quadricula_folha_mdt_mds_2020'],
    //'Camadas': [],
    'Levantamentos': [36],
    'Escalas': [''],
    'Pasta': 'MDT_2020',
    'PadraoArquivo': '$$$.zip'
},
{
    'id': 22, // MDS 2020
    'Camadas': ['geoportal:quadricula_folha_mdt_mds_2020'],
    //'Camadas': [],
    'Levantamentos': [36],
    'Escalas': [''],
    'Pasta': 'MDS_2020',
    'PadraoArquivo': '$$$.zip'
},
{
    'id': 23, // Plano Rodoviário Municipal 1979
    'Camadas': ['geoportal:quadricula_plano_municipalrodoviario_1979'],
    //'Camadas': [],
    'Levantamentos': [42],
    'Escalas': [''],
    'Pasta': 'PLANO_MUNICIPAL_RODOVIARIO_1979',
    'PadraoArquivo': 'PRM_$$$.tif'
}
];


montaQuadriculaAutoComplete = function () {

    $('#txtQuadricula').attr('disabled', true);
    $('#lstQuadricula').attr('disabled', true);

    $("#txtQuadricula").css('text-transform', 'uppercase');

    $("#txtQuadricula").keyup(function () {
        if (this.value.length >= 1) {
            var _camada = arrCamadas[$("#cboTipoMapaArticulado").val()];
            //console.log(_camada);
            PageMethods.pesquisaQuadriculaAutoComplete($("#txtQuadricula").val(), _camada.Levantamentos.join().toString(), onSuccessQuadriculaAutoComplete, onErrorQuadriculaAutoComplete);
        }
        else {
            $('#lstQuadricula option[value!="0"]').remove();
        }
    });


    $("#lstQuadricula").change(function () {

        var arrValue = this.value.split('|');
        var tipoid = parseInt(arrValue[0], 10);
        var featid = parseInt(arrValue[1], 10);

        var _camada = arrCamadas[$("#cboTipoMapaArticulado").val()];
        var _NM_CAMADA = NM_LAYER_MAPA_ARTICULADO_QUADRICULA_WFS; //"geoportal:quadricula"; //_camada.Camadas[_camada.Levantamentos.indexOf(tipoid)];
        var _NM_GEOMETRIA = NM_GEOMETRIA_MAPA_ARTICULADO;  //"ge_poligono";


        if (_NM_CAMADA != undefined && _NM_CAMADA != '') {

            loading();

            //Reseta o mapa
            _limpaSelecao();

            //Montagem da string de filtro CQL
            var cqlFilter = "cd_identificador_quadricula = " + featid;

            var _hc = jQuery('#hc', window.parent.document).val();

            var QuadriculaSelect_wfs_options = {
                url: 'map.geo?hc=' + _hc + '&tipoServico=DWFS1',
                transparent: true,
                params: {
                    request: "GetFeature",
                    service: "wfs",
                    version: "1.0.0",
                    typeName: _NM_CAMADA,
                    featureType: _NM_CAMADA,
                    CQL_FILTER: cqlFilter
                },
                format: new OpenLayers.Format.GML({
                    geometryName: _NM_GEOMETRIA
                })
            };

            OpenLayers.Feature.Vector.style["select"].strokeWidth = 2;

            layerQuadriculaSelect = new OpenLayers.Layer.Vector("Quadricula", {
                strategies: [new OpenLayers.Strategy.Fixed()],
                protocol: new OpenLayers.Protocol.HTTP(QuadriculaSelect_wfs_options),
                styleMap: new OpenLayers.Style(OpenLayers.Feature.Vector.style["select"])
            });

            //Adicionando a camada da subprefeitura pesquisada no mapa
            map.addLayer(layerQuadriculaSelect);

            OpenLayers.Feature.Vector.style['select']['cursor'] = 'pointer';

            layerQuadriculaSelect.events.register("featureadded", this, function (e) {
                var lat, lon, zoom;
                lon = layerQuadriculaSelect.features[0].geometry.getCentroid().x;
                lat = layerQuadriculaSelect.features[0].geometry.getCentroid().y;
                zoom = 6;
                var olLonLat = new OpenLayers.LonLat(lon, lat);

                //Setando a posição do mapa para o logradouro pesquisado
                //map.setCenter(olLonLat, zoom, false, false);
                map.moveTo(olLonLat, zoom);

                closeloading();

                //Fechando a popup de pesquisa
                //fechaPopup();
                document.getElementById('drag').style.display = 'none';
                //map.controls[9].panel_div.className = map.controls[9].displayClass + "ItemInactive olButton";
                globalctlBtnPesquisaLogradouro.panel_div.className = globalctlBtnPesquisaLogradouro.displayClass + "ItemInactive olButton";
                this.selectedIndex = -1;


            });

            _featureclick = function () {
                //console.log(layerQuadriculaSelect);
                //console.log(Math.random());

                //layerQuadriculaSelect.events.register("featureclick", this, function (e) {

                //console.log(layerQuadriculaSelect);
                var strHTMLifr = "<iframe id=_ifrDown name=_ifrDown width=0 height=0 border=0></iframe>";
                var strLinkHTML = '';
                //var feats = LayerSelecaoMapaArticulado.features;
                //var feats = vectorCamadaMapaArticulado.features;
                var feats = layerQuadriculaSelect.features;


                for (var k = 0; k < feats.length; k++) {

                    var feat = feats[k];
                    //var feat = LayerSelecaoMapaArticulado.features[0]; //e.feature;
                    var _cd_quadricula = feat.attributes['cd_quadricula'];
                    var _camada = arrCamadas[$("#cboTipoMapaArticulado").val()];
                    var _nm_pasta = _camada.Pasta;
                    var _padrao_arquivo = _camada.PadraoArquivo;
                    var _nm_arquivo = _padrao_arquivo.replace('$$$', _cd_quadricula);

                    var _escala = _camada.Escalas[_camada.Levantamentos.indexOf(parseInt(feat.attributes['cd_levantamento'], 10))];
                    var _strEscala = (_escala != '') ? '&nbsp;(' + _escala + ')' : '';
                    var _lev = parseInt(feat.attributes['cd_levantamento'], 10);

                    if ($("#cboTipoMapaArticulado").val() == '10') {
                        var _prefix_orto_2004 = (_lev == 11) ? '1O_' : (_lev == 12) ? '5O_' : '';
                        _nm_arquivo = _prefix_orto_2004 + _nm_arquivo;
                    }
                    _nm_arquivo = (_lev == 10) ? _nm_arquivo.toUpperCase() : _nm_arquivo;
                    //console.log(_nm_arquivo);


                    var arrSCM = (new String(_cd_quadricula + ';')).split(';');
                    if ($("#cboTipoMapaArticulado").val() == '15') {
                        for (var i = 0; i < arrSCM.length - 1; i++) {
                            strLinkHTML = "<a class=down target=_ifrDown href=downloadIfr.aspx?orig=DownloadQuadriculas&arq=" + arrSCM[i] + "&arqTipo=PDF>PDF</a>";
                            strLinkHTML += "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<a class=down target=_ifrDown href=downloadIfr.aspx?orig=DownloadQuadriculas&arq=" + arrSCM[i] + "&arqTipo=DXF>DXF (zip)</a>";
                            strLinkHTML += "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<a class=down target=_ifrDown href=downloadIfr.aspx?orig=DownloadQuadriculas&arq=" + arrSCM[i] + "&arqTipo=MDT>MDT DXF (zip)</a>";
                        }
                    } else if ($("#cboTipoMapaArticulado").val() == '16') { //MDT                     
                        for (var i = 0; i < arrSCM.length - 1; i++) {
                            strLinkHTML = "<a class=down target=_ifrDown href=downloadIfr.aspx?orig=DownloadMapaArticulacao&arq=" + escape(_nm_pasta + "\\" + _nm_arquivo) + "&arqTipo=MAPA_ARTICULACAO>ZIP</a>";
                            strLinkHTML += "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<a class=down target=blank href=https://visualizador-laz-web.s3-sa-east-1.amazonaws.com/index.html?mdt=1&scm=" + arrSCM[i] + ">Visualizador Web</a>";
                        }
                    }
                    else if ($("#cboTipoMapaArticulado").val() == '17') { //MDS                     
                        for (var i = 0; i < arrSCM.length - 1; i++) {
                            strLinkHTML = "<a class=down target=_ifrDown href=downloadIfr.aspx?orig=DownloadMDSLAZ&arq=" + escape(_nm_pasta + "\\" + _nm_arquivo) + "&arqTipo=LAZ>LAZ</a>";
                            strLinkHTML += "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<a class=down href=https://laz-m3dc-pmsp.s3-sa-east-1.amazonaws.com/MDS_color_" + arrSCM[i] + ".laz>LAZ(color)</a>";
                            strLinkHTML += "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<a class=down target=blank href=https://github.com/geoinfo-smdu/metadados-MDS/tree/master/MDS/" + arrSCM[i] + ">Metadados</a>";
                            strLinkHTML += "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<a class=down target=blank href=https://visualizador-laz-web.s3-sa-east-1.amazonaws.com/index.html?scm=" + arrSCM[i] + ">Visualizador Web</a>";
                            painelMensagemVisualizadorLAZ();
                        }
                    }
                    else {
                        strLinkHTML += "<a class=down target=_ifrDown href=downloadIfr.aspx?orig=DownloadMapaArticulacao&arq=" + escape(_nm_pasta + "\\" + _nm_arquivo) + "&arqTipo=MAPA_ARTICULACAO>" + _nm_arquivo + _strEscala + "</a>";
                    }
                }
                var strHTMLDiv = "<div id='divComboCamadas'>" + strLinkHTML + "</div>";

                jQuery('#divArquivos').html(strHTMLDiv + strHTMLifr);

                jQuery('#divDownloadArquivos').show();

                //console.log(layerQuadriculaSelect.features[0]);

                //});

            }

            var _selectFeature = new OpenLayers.Control.SelectFeature(
                                layerQuadriculaSelect,
                                {
                                    onSelect: _featureclick,
                                    autoActivate: true
                                }
                            );
            map.addControl(_selectFeature);


        }



    });

}

limpaPesquisaQuadricula = function () {
    $("#txtQuadricula").val('');
    $('#lstQuadricula option[value!="0"]').remove();
    $('#cboTipoMapaArticulado').val('0');
    $('#txtQuadricula').attr('disabled', true);
    $('#lstQuadricula').attr('disabled', true);
}



//===========================================================================================================================
//===========================================================================================================================
//===========================================================================================================================

var layerLoteSelect;
pesquisaLoteInscricao = function () {

    var nrSetor = $('#txtSetorLote').val();
    var nrQuadra = $('#txtQuadraLote').val();
    var tpQuadra = $('#cboTipoQuadraLote').val();
    var nrLote = $('#txtLote').val();
    var tpLote = $('#cboTipoLote').val();
    var nrCondominio = $('#txtCondominioLote').val();

    if (parseInt(nrSetor, 10) < 1 || parseInt(nrSetor, 10) > 310 || nrSetor == '') {
        jAlert('Para o campo Setor os valores válidos estão entre 001 e 310.', 'Mensagem', function () { });
        closeloading();
        return false;
    }

    if (parseInt(nrSetor, 10) == 92) {
        jAlert('O setor pesquisado não existe.', 'Mensagem', function () { });
        closeloading();
        return false;
    }

    //if (parseInt(nrQuadra, 10) < 1 || parseInt(nrQuadra, 10) > 999 || nrQuadra == '') {
    if (parseInt(nrQuadra, 10) < 1 || parseInt(nrQuadra, 10) > 999) {
        jAlert('Para o campo Quadra os valores válidos estão entre 001 e 999.', 'Mensagem', function () { });
        closeloading();
        return false;
    }

    if (parseInt(nrLote, 10) < 0 || parseInt(nrLote, 10) > 9999) {
        jAlert('Para o campo Lote os valores válidos estão entre 0000 e 9999.', 'Mensagem', function () { });
        closeloading();
        return false;
    }

    if (parseInt(nrCondominio, 10) < 0 || parseInt(nrCondominio, 10) > 99) {
        jAlert('Para o campo Lote os valores válidos estão entre 00 e 99.', 'Mensagem', function () { });
        closeloading();
        return false;
    }

    loading();

    if (nrSetor != '' && nrQuadra == '' && nrLote == '' && nrCondominio == '') {
        pesquisaSetor();
    }
    else if (nrQuadra != '' && nrLote == '' && nrCondominio == '' && tpLote != '') {
        PageMethods.pesquisaQuadraInscricao(nrSetor, nrQuadra, tpQuadra, onSuccessPesqLoteInscricao, onErrorPesqLoteInscricao);
    }
    else {
        PageMethods.pesquisaLoteInscricao(nrSetor, nrQuadra, tpQuadra, nrLote, tpLote, nrCondominio, onSuccessPesqLoteInscricao, onErrorPesqLoteInscricao);
    }
}


onErrorPesqLoteInscricao = function (desc) { console.log(desc); }
onSuccessPesqLoteInscricao = function (res) {

    OpenLayers.Feature.Vector.style['select']['cursor'] = 'default';

    var arrLotesQuadras = res;

    if (arrLotesQuadras.length > 0) {

        //Reseta o mapa
        _limpaSelecao();

        var strLotesQuadras = '';
        for (var i = 0; i < arrLotesQuadras.length; i++) {
            strLotesQuadras += arrLotesQuadras[i]['FEATID'] + ',';
        }

        strLotesQuadras = strLotesQuadras.substring(0, strLotesQuadras.length - 1);


        //**************************************
        //SS22358

        //Montagem da string de filtro CQL
        var nrQuadra = $('#txtQuadraLote').val();
        var nrLote = $('#txtLote').val();
        var tpLote = $('#cboTipoLote').val();
        var nrCondominio = $('#txtCondominioLote').val();

        if (nrQuadra != '' && nrLote == '' && nrCondominio == '' && tpLote != '') {
            var cqlFilter = "cd_identificador IN (" + strLotesQuadras + ")";
            var tempTypeName = NM_LAYER_QUADRA_FISCAL_WFS
            var tempFeatureName = NM_LAYER_QUADRA_FISCAL_WFS;
            var tempGeometryName = NM_GEOMETRIA_QUADRA_FISCAL;
        } else {
            var cqlFilter = "cd_identificador IN (" + strLotesQuadras + ")";
            var tempTypeName = NM_LAYER_LOTE_WFS;
            var tempFeatureName = NM_LAYER_LOTE_WFS;
            var tempGeometryName = NM_GEOMETRIA_LOTE;
        }

        //***************************************


        var _hc = jQuery('#hc', window.parent.document).val();

        var layerLoteSelect_wfs_options = {
            url: 'map.geo?hc=' + _hc + '&tipoServico=DWFS1',
            transparent: true,
            params: {
                request: "GetFeature",
                service: "wfs",
                version: "1.0.0",
                typeName: tempTypeName,
                featureType: tempFeatureName,
                CQL_FILTER: cqlFilter
            },
            format: new OpenLayers.Format.GML({
                geometryName: tempGeometryName
            })
        };

        OpenLayers.Feature.Vector.style["select"].strokeWidth = 2;

        layerLoteSelect = new OpenLayers.Layer.Vector("Lote", {
            strategies: [new OpenLayers.Strategy.Fixed()],
            protocol: new OpenLayers.Protocol.HTTP(layerLoteSelect_wfs_options),
            styleMap: new OpenLayers.Style(OpenLayers.Feature.Vector.style["select"])
        });



        //Adicionando a camada do logradouro pesquisado no mapa
        map.addLayer(layerLoteSelect)


        layerLoteSelect.events.register("featureadded", this, function (e) {
            var lat, lon, zoom;
            lon = layerLoteSelect.features[0].geometry.getCentroid().x;
            lat = layerLoteSelect.features[0].geometry.getCentroid().y;
            zoom = 10;
            var olLonLat = new OpenLayers.LonLat(lon, lat);

            //Setando a posição do mapa para o logradouro pesquisado
            //map.setCenter(olLonLat, zoom, false, false);
            //map.moveTo(olLonLat, zoom);

            closeloading();

            //Fechando a popup de pesquisa
            //fechaPopup();
            //document.getElementById('drag').style.display = 'none';
            //map.controls[9].panel_div.className = map.controls[9].displayClass + "ItemInactive olButton";
            //globalctlBtnPesquisaLogradouro.panel_div.className = globalctlBtnPesquisaLogradouro.displayClass + "ItemInactive olButton";
        });


        layerLoteSelect.events.register("featuresadded", this, function (e) {
            map.zoomToExtent(layerLoteSelect.getDataExtent());
            map.zoomOut(); //ss22352
        });



    }
    else {
        //jAlert('Registro não encontrado.', 'Mensagem', function () { });
        jAlert('Caso tenha pesquisado por QUADRA, o registro consultado não existe (cadastro ou mapa).<br> <br> Caso tenha pesquisado por LOTE, o registro consultado pertence a um condomínio ou não existe (cadastro ou mapa). Entre em contato com <a href="mailto:geosampa@prefeitura.sp.gov.br">geosampa@prefeitura.sp.gov.br</a>.', 'Mensagem', function () { });
        closeloading();
        return false;
    }
}



/*Pesquisa Área Pública*/
var layerAreaPublicaSelect;
pesquisaAreaPublica = function () {


    var nrArea = $('#txtAreaAreaPublica').val();
    var nrCroquiLote = $('#txtCroquiLoteamento').val();
    var nrAreaCedida = $('#txtAreaCedida').val();
    var nrPlantaDISDUP = $('#txtPlantaDISDUP').val();

    if (nrArea == '' && nrCroquiLote == '' && nrAreaCedida == '' && nrPlantaDISDUP == '') {
        jAlert('É necessário preencher os campos para localizar a Área Pública, Croqui Patrimonial, Área Cedida ou Planta DIS DUP.', 'Mensagem', function () { });
        closeloading();
        return false;
    }

    if (nrCroquiLote == '' && nrAreaCedida == '' && nrPlantaDISDUP == '') {

        if (parseInt(nrArea, 10) < 0 || parseInt(nrArea, 10) > 999999 || nrArea == '') {
            jAlert('Para o campo código de registro da área pública os valores válidos estão entre 000000 e 999999.', 'Mensagem', function () { });
            closeloading();
            return false;
        }

        localizaAreaPublica();

    }
    else if (nrCroquiLote != '' && nrAreaCedida == '' && nrPlantaDISDUP == '') {
        //loading();
        //PageMethods.pesquisaAreaPublicaCroqui(nrCroquiLote, onSuccessPesqAreaPublicaCroqui, onErrorPesqAreaPublicaCroqui);                                                      
        //a função abaixo substiui o pagemethod pesquisaAreaPublicaCroqui, devido a simplificação de regra de negocio, modelo de dados e desativação da procedure du0110_bcd.p_sel_loteamento_croqui_area_filtro_codigo
        localizaCroquiPatrimonial();
    }
    else if (nrAreaCedida != '' && nrPlantaDISDUP == '') {
        localizaAreaCedida();
    }
    else {
        localizaPlantaDISDUP();
    }


}

onErrorPesqAreaPublica = function (desc) { console.log(desc); }
onSuccessPesqAreaPublica = function (res) {

    var arrArea = res;

    if (arrArea.length > 0) {

        //Reseta o mapa
        _limpaSelecao();

        var strArea = '';
        for (var i = 0; i < arrArea.length; i++) {
            strArea += arrArea[i]['FEATID'] + ',';
        }
        strArea = strArea.substring(0, strArea.length - 1);

        //Montagem da string de filtro CQL
        var cqlFilter = "cd_identificador_area_municipal IN (" + strArea + ")";

        var _hc = jQuery('#hc', window.parent.document).val();

        var layerAreaPublicaSelect_wfs_options = {
            url: 'map.geo?hc=' + _hc + '&tipoServico=DWFS1',
            transparent: true,
            params: {
                request: "GetFeature",
                service: "wfs",
                version: "1.0.0",
                typeName: NM_LAYER_AREA_PUBLICA_WFS,
                featureType: NM_LAYER_AREA_PUBLICA_WFS,
                CQL_FILTER: cqlFilter
            },
            format: new OpenLayers.Format.GML({
                geometryName: NM_GEOMETRIA_AREA_PUBLICA
            })
        };

        OpenLayers.Feature.Vector.style["select"].strokeWidth = 2;

        layerAreaPublicaSelect = new OpenLayers.Layer.Vector("Area_Publica", {
            strategies: [new OpenLayers.Strategy.Fixed()],
            protocol: new OpenLayers.Protocol.HTTP(layerAreaPublicaSelect_wfs_options),
            styleMap: new OpenLayers.Style(OpenLayers.Feature.Vector.style["select"])
        });

        //Adicionando a camada do logradouro pesquisado no mapa
        map.addLayer(layerAreaPublicaSelect)

        layerAreaPublicaSelect.events.register("featureadded", this, function (e) {
            var lat, lon, zoom;
            lon = layerAreaPublicaSelect.features[0].geometry.getCentroid().x;
            lat = layerAreaPublicaSelect.features[0].geometry.getCentroid().y;
            zoom = 8;
            var olLonLat = new OpenLayers.LonLat(lon, lat);

            //Setando a posição do mapa para o logradouro pesquisado
            //map.setCenter(olLonLat, zoom, false, false);
            map.moveTo(olLonLat, zoom);

            closeloading();

            //Fechando a popup de pesquisa
            //fechaPopup();
            document.getElementById('drag').style.display = 'none';
            //map.controls[9].panel_div.className = map.controls[9].displayClass + "ItemInactive olButton";
            globalctlBtnPesquisaLogradouro.panel_div.className = globalctlBtnPesquisaLogradouro.displayClass + "ItemInactive olButton";

        });


        layerAreaPublicaSelect.events.register("featureclick", this, function (e) {

            //console.log(e.feature);

            var feat = e.feature;

            var _nm_arquivo = feat.attributes['cd_croqui_area'];
            _nm_arquivo = _nm_arquivo.substring(0, 6) + '.pdf';

            //console.log(_nm_arquivo);

            var strHTMLifr = "<iframe id=_ifrDown name=_ifrDown width=0 height=0 border=0></iframe>";

            var strLinkHTML = "<a class=down target=_ifrDown href=downloadIfr.aspx?orig=DownloadAreaPublica&arq=" + escape(_nm_arquivo) + "&arqTipo=AREA_PUBLICA>" + _nm_arquivo + "</a>";

            var strHTMLDiv = "<div id='divComboCamadas'>" + strLinkHTML + "</div>";

            jQuery('#divArquivos').html(strHTMLDiv + strHTMLifr);

            jQuery('#divDownloadArquivos').show();

        });

    }
    else {
        jAlert('Não há registros para a pesquisa realizada.', 'Mensagem', function () { });
        closeloading();
        return false;
    }
}



onErrorPesqAreaPublicaCroqui = function (desc) { console.log(desc); }
onSuccessPesqAreaPublicaCroqui = function (res) {

    var arrArea = res;

    if (arrArea.length > 0) {

        //Reseta o mapa
        _limpaSelecao();

        var strArea = '';
        var strNmPDF = '';
        for (var i = 0; i < arrArea.length; i++) {
            strArea += arrArea[i]['CD_CROQ_AREA'] + ',';
            strNmPDF += arrArea[i]['TX_ENDERECO'] + ',';
        }
        strArea = strArea.substring(0, strArea.length - 1);
        strNmPDF = strNmPDF.substring(strNmPDF.lastIndexOf('/') + 1, strNmPDF.length - 1);

        //Montagem da string de filtro CQL
        var cqlFilter = "cd_croqui IN (" + strArea + ")";

        var _hc = jQuery('#hc', window.parent.document).val();

        var layerAreaPublicaSelect_wfs_options = {
            url: 'map.geo?hc=' + _hc + '&tipoServico=DWFS1',
            transparent: true,
            params: {
                request: "GetFeature",
                service: "wfs",
                version: "1.0.0",
                typeName: NM_LAYER_LOTEAMENTO_CROQUI_AREA_WFS,
                featureType: NM_LAYER_LOTEAMENTO_CROQUI_AREA_WFS,
                CQL_FILTER: cqlFilter
            },
            format: new OpenLayers.Format.GML({
                geometryName: NM_GEOMETRIA_LOTEAMENTO_CROQUI_AREA
            })
        };

        OpenLayers.Feature.Vector.style["select"].strokeWidth = 2;

        layerAreaPublicaSelect = new OpenLayers.Layer.Vector("Area_Publica", {
            strategies: [new OpenLayers.Strategy.Fixed()],
            protocol: new OpenLayers.Protocol.HTTP(layerAreaPublicaSelect_wfs_options),
            styleMap: new OpenLayers.Style(OpenLayers.Feature.Vector.style["select"])
        });

        //Adicionando a camada do logradouro pesquisado no mapa
        map.addLayer(layerAreaPublicaSelect)

        layerAreaPublicaSelect.events.register("featureadded", this, function (e) {
            var lat, lon, zoom;
            lon = layerAreaPublicaSelect.features[0].geometry.getCentroid().x;
            lat = layerAreaPublicaSelect.features[0].geometry.getCentroid().y;
            zoom = 8;
            var olLonLat = new OpenLayers.LonLat(lon, lat);

            //Setando a posição do mapa para o logradouro pesquisado
            //map.setCenter(olLonLat, zoom, false, false);
            map.moveTo(olLonLat, zoom);

            closeloading();

            //Fechando a popup de pesquisa
            //fechaPopup();
            document.getElementById('drag').style.display = 'none';
            //map.controls[9].panel_div.className = map.controls[9].displayClass + "ItemInactive olButton";
            globalctlBtnPesquisaLogradouro.panel_div.className = globalctlBtnPesquisaLogradouro.displayClass + "ItemInactive olButton";

        });


        layerAreaPublicaSelect.events.register("featureclick", this, function (e) {

            //console.log(e.feature);

            var feat = e.feature;

            var _nm_arquivo = strNmPDF;

            //console.log(_nm_arquivo);

            var strHTMLifr = "<iframe id=_ifrDown name=_ifrDown width=0 height=0 border=0></iframe>";

            var strLinkHTML = "<a class=down target=_ifrDown href=downloadIfr.aspx?orig=DownloadLoteamentoCroquiArea&arq=" + escape(_nm_arquivo) + "&arqTipo=LOTEAMENTO_CROQUI_AREA>" + _nm_arquivo + "</a>";

            var strHTMLDiv = "<div id='divComboCamadas'>" + strLinkHTML + "</div>";

            jQuery('#divArquivos').html(strHTMLDiv + strHTMLifr);

            jQuery('#divDownloadArquivos').show();

        });

    }
    else {
        jAlert('Não há registros para a pesquisa realizada.', 'Mensagem', function () { });
        closeloading();
        return false;
    }
}


/*********************************************************
Nome: _imprimeMapa()
Objetivo: Abre DIV de impressão
Disparador(es): ctlBtnImpressao
**********************************************************/
_imprimeMapa = function (bool) {

    jAlert('Funcionalidade em desenvolvimento.', 'Mensagem', function () { });
    closeloading();

    /*
    //desativa ou remove os controles no mapa da tela
    map.controls[0].deactivate();  //Desativa barra de botões
    map.controls[12].deactivate(); //Desativa escala

    //guarda elementos do mapa sem os controles
    varSizeW = map.getSize().w;
    varSizeH = map.getSize().h;
    varMapa = document.getElementById('map').innerHTML;

    //abre popup com a página de impressão
    jQuery('#divImpressao', window.document).show();
    abrePopupPrint();

    //Copia o mapa para o popup
    document.getElementById('MapaPrint').innerHTML = varMapa;
    //   document.getElementById('divEscalaInside').innerHTML = "";

    //ativa ou adiciona novamente os controles no mapa da tela
    map.controls[0].activate(); //Ativa barra de botões
    map.controls[12].activate(); //Ativa escala

    */
}


limitaTituloImpressao = function () {
    jQuery('#txtTituloMapaImpressao').limiter(256, jQuery('#contChar'));
}







/*********************************************************
Nome: _downloadImagem()
Objetivo: Efetua o download da visualização do mapa em imagem
Disparador(es): ctlBtnDownloadImagem
**********************************************************/
_downloadImagem = function () {
    //Desselecionar Distância Parcial e Total caso esteja selecionada

    downloadImagem();
}



/*********************************************************
Nome: getLayerInfo()
Objetivo: Ao selecionar a camada desejada no combo, faz a pesquisa das informações usando CQLFilter
Disparador(es): cboCamada
**********************************************************/
getLayerInfo = function (cbo) {

    var val = cbo.value;
    var Campofeatures;
    var Labelfeatures;

    //Deixa por default uma mensagem no lugar do grid. Se o evento featureadded for chamado, o grid substituirá a mensagem
    document.getElementById("gridPesqInfo").innerHTML = "";

    if (val != '') {

        var _hc = jQuery('#hc', window.parent.document).val();

        var arrLayer = val.split('|');
        var nmCamada = arrLayer[0];
        var nmGeometria = arrLayer[1];
        var Campofeatures = arrLayer[2];
        var Labelfeatures = arrLayer[3];
        var tipo = arrLayer[4];

        var precisao = Math.round(10 * map.getResolution());

        var Campofeatures = Campofeatures.split('#');
        var Labelfeatures = Labelfeatures.split('#');

        //Se já tiver feito uma pesquisa, o layer já estará no mapa. Deve ser excluída antes de incluir uma nova
        var arrLayerInfo = map.getLayersByName("LayerInfo");
        if (arrLayerInfo.length > 0) {
            map.removeLayer(arrLayerInfo[0]);
        }

        if (tipo == 'DWITHIN') {
            //cria vetor filtrando pela coordenada X, Y
            var wfsPesqInfos_options = {
                url: 'map.geo?hc=' + _hc + '&tipoServico=DWFS1',
                params: {
                    request: "GetFeature",
                    service: "wfs",
                    version: "1.0.0",
                    typeName: nmCamada,
                    featureType: nmCamada,
                    cql_filter: "DWITHIN(" + nmGeometria + ", POINT (" + lonLatSelecao.lon + " " + lonLatSelecao.lat + ")," + precisao + ", meters)"
                },
                format: new OpenLayers.Format.GML({
                    geometryName: nmGeometria
                })
            };
        } else if (tipo == 'WFS_EXTERNO') {
            //cria vetor filtrando pela coordenada X, Y
            var wfsPesqInfos_options = {
                url: 'map.geo?hc=' + _hc + '&tipoServico=WFS_EXTERNO',
                params: {
                    request: "GetFeature",
                    service: "wfs",
                    version: "1.0.0",
                    typeName: nmCamada,
                    featureType: nmCamada,
                    ENCODING: "UTF-8",
                    //filter: "323941.52227723 7387167.4653508"
                    filter: "<Filter><Intersects><PropertyName>msGeometry</PropertyName><gml:Point><gml:coordinates>" + lonLatSelecao.lon + " " + lonLatSelecao.lat + "</gml:coordinates></gml:Point></Intersects></Filter>"
                    /*featureID: "favela.Vila Clara"*/
                },
                format: new OpenLayers.Format.GML({
                    geometryName: nmGeometria
                })
                /*msGeometry*/
            };
        } else {
            //cria vetor filtrando pela coordenada X, Y
            var wfsPesqInfos_options = {
                url: 'map.geo?hc=' + _hc + '&tipoServico=DWFS1',
                params: {
                    request: "GetFeature",
                    service: "wfs",
                    version: "1.0.0",
                    typeName: nmCamada,
                    featureType: nmCamada,
                    cql_filter: "INTERSECTS(" + nmGeometria + ",POINT(" + lonLatSelecao.lon + " " + lonLatSelecao.lat + "))"
                },
                format: new OpenLayers.Format.GML({
                    geometryName: nmGeometria
                })
            };
        }





        var layerInfo = new OpenLayers.Layer.Vector("LayerInfo", {
            strategies: [new OpenLayers.Strategy.Fixed()],
            protocol: new OpenLayers.Protocol.HTTP(wfsPesqInfos_options),
            styleMap: new OpenLayers.Style(OpenLayers.Feature.Vector.style["select"])
        });

        map.addLayer(layerInfo);

        layerInfo.events.register("featuresadded", this, function (e) {
            //console.log(layerInfo.features);

            var LayerInfoFeat = layerInfo.features;

            //var Labelfeatures = ['Setor', 'Quadra', 'Tipo', 'Data Criação'];
            //var Campofeatures = ['COD_SETOR_FISCAL', 'COD_QUADRA_PREDIAL', 'TIPO_QUADRA_PREDIAL', 'DATA_CRIACAO'];

            //cria o array com os valores das features
            var valores = "[";

            for (var i = 0; i < LayerInfoFeat.length; i++) {
                valores += "{";
                //Varre todos os camposFeatures que deve ter no grid
                for (var c = 0; c < Campofeatures.length; c++) {

                    if (LayerInfoFeat[i].attributes[Campofeatures[c]] != undefined) {
                        valores += Campofeatures[c] + ": '" + LayerInfoFeat[i].attributes[Campofeatures[c]].replace("'", "") + "',"
                    } else {
                        valores += Campofeatures[c] + ": '" + LayerInfoFeat[i].attributes[Campofeatures[c]] + "',"
                    }


                }
                valores = valores.substring(0, valores.length - 1);
                valores += "},";
            }
            valores = valores.substring(0, valores.length - 1);
            valores += "]";
            valores = eval(valores);


            var table = "";

            //inverte array, transformando em feature, valor (2 colunas)
            for (var v = 0; v < valores.length; v++) {
                for (var f = 0; f < Labelfeatures.length; f++) {

                    if (valores[v][Campofeatures[f]] != "undefined") {
                        table += "{ feature: '" + Labelfeatures[f] + "', valor: '" + valores[v][Campofeatures[f]] + "'},";
                    } else {
                        table += "{ feature: '" + Labelfeatures[f] + "', valor: ''},";
                    }



                }
            }
            table = "[" + table + "]";
            tablec = eval(table);

            var rowNumDinamic = Labelfeatures.length;  //essa variável será utilizada para fazer a "quebra de página" no grid a cada registro de features.

            carregaGridInfoDinamico(rowNumDinamic, tablec);
        });


    }
    else {
        document.getElementById("gridPesqInfo").innerHTML = "";
        //jAlert('Selecione uma camada', 'Mensagem', function () { });
    }

    //muda cursor das layers para crosshair pois o controle de info ainda está selecionado
    $('div.olLayerDiv').css('cursor', 'crosshair')

}




/*
Nome: renovaSession()
Objetivo: Captura o retorno de erro e exibe no console
Parâmetro(s): min - intervalo em minutos para renovação da sessão
Disparador(es): callback de erro da função renovaSession()
*/
var sessionRenovaInterval;
renovaSession = function (min) {
    sessionRenovaInterval = window.setInterval('PageMethods.renovaSession(onSuccessRenovaSession, onErrorRenovaSession)', (min * 60000));
}


/*
Nome: onSuccessRenovaSession()
Objetivo: Captura o retorno de sucesso e exibe no console
Disparador(es): callback de erro da função renovaSession()
*/
onSuccessRenovaSession = function (res) { /*console.log(res);*/ };

/*
Nome: onErrorRenovaSession()
Objetivo: Captura o retorno de erro e exibe no console
Disparador(es): callback de erro da função renovaSession()
*/
onErrorRenovaSession = function (res) { /*console.log(res);*/ };


mudaTipoMapaArticulado = function (cbo) {
    var iCamada = cbo.value;



    //console.log(arrCamadas[iCamada]);
    //console.log(arrCamadas[iCamada].Camadas.length);

    $("#txtQuadricula").val('');
    $('#lstQuadricula option[value!="0"]').remove();

    if (iCamada > 0 && arrCamadas[iCamada].Levantamentos.length > 0) {
        $('#txtQuadricula').attr('disabled', false);
        $('#lstQuadricula').attr('disabled', false);

    }
    else {
        $('#txtQuadricula').attr('disabled', true);
        $('#lstQuadricula').attr('disabled', true);
    }
}



//Funções específicas para controles específicos


//Modifica as funções originais do OpenLayers para alterar as classes dos controles de GetFeature do PDF
fnRegularPDFSetorAct = function () {
    var a = this.panel_div;
    a.className = a.className.replace(RegExp("\\b(" + this.displayClass + "ItemPDFSetor)Inactive\\b"), "$1Active")
    $('div.olLayerDiv').css('cursor', 'crosshair');
    controlesClick(globalctlBtnPDFSetor, "C");
};

fnRegularPDFSetorDeact = function () {
    var a = this.panel_div;
    a.className = a.className.replace(RegExp("\\b(" + this.displayClass + "ItemPDFSetor)Active\\b"), "$1Inactive")
    $('div.olLayerDiv').css('cursor', 'default')
};

//fnInactivePDF = function () { var a = this.panel_div; a.className = a.className.replace(RegExp("\\b(" + this.displayClass + "Item)Inactive\\b"), "$1Inactive") };
/*fnInactivePDFSetor = function () {
var a = this.panel_div;
var cGetfeature = globalctlBtnPDFSetor
a.className = a.className.replace(RegExp("\\b(" + this.displayClass + "ItemPDFSetor)Inactive\\b"), "$1Inactive")
cGetfeature.deactivate();
$('div.olLayerDiv').css('cursor', 'default')
};*/

//Modifica as funções originais do OpenLayers para alterar as classes dos controles de GetFeature do PDF
fnRegularPDFQuadraAct = function () {
    var a = this.panel_div;
    a.className = a.className.replace(RegExp("\\b(" + this.displayClass + "ItemPDFQuadra)Inactive\\b"), "$1Active")
    $('div.olLayerDiv').css('cursor', 'crosshair')
    controlesClick(globalctlBtnPDFQuadra, "C");
};

fnRegularPDFQuadraDeact = function () {
    var a = this.panel_div;
    a.className = a.className.replace(RegExp("\\b(" + this.displayClass + "ItemPDFQuadra)Active\\b"), "$1Inactive")
    $('div.olLayerDiv').css('cursor', 'default')
};

//fnInactivePDF = function () { var a = this.panel_div; a.className = a.className.replace(RegExp("\\b(" + this.displayClass + "Item)Inactive\\b"), "$1Inactive") };
/*fnInactivePDFQuadra = function () {
var a = this.panel_div;
var cGetfeature = globalctlBtnPDFQuadra
a.className = a.className.replace(RegExp("\\b(" + this.displayClass + "ItemPDFQuadra)Inactive\\b"), "$1Inactive")
cGetfeature.deactivate();
$('div.olLayerDiv').css('cursor', 'default')
};*/





//Modifica as funções originais do OpenLayers para alterar as classes do controle de GetFeature da Selecao
fnRegularSelecaoAct = function () {
    var a = this.panel_div;
    a.className = a.className.replace(RegExp("\\b(" + this.displayClass + "ItemSelecao)Inactive\\b"), "$1Active")
    $('div.olLayerDiv').css('cursor', 'crosshair')
    controlesClick(globalctlGetSelecao, "C");
};

fnRegularSelecaoDeact = function () {
    var a = this.panel_div;
    a.className = a.className.replace(RegExp("\\b(" + this.displayClass + "ItemSelecao)Active\\b"), "$1Inactive")
    $('div.olLayerDiv').css('cursor', 'default')
};



fnRegularSelecaoDownAct = function () {
    var a = this.panel_div;
    a.className = a.className.replace(RegExp("\\b(" + this.displayClass + "ItemSelecao)Inactive\\b"), "$1Active")
    $('div.olLayerDiv').css('cursor', 'crosshair');
    controlesClick(globalctlGetSelecaoDown, "C");
};

fnRegularSelecaoDownDeact = function () {
    var a = this.panel_div;
    a.className = a.className.replace(RegExp("\\b(" + this.displayClass + "ItemSelecao)Active\\b"), "$1Inactive")
    $('div.olLayerDiv').css('cursor', 'default');
};



/*********************************************************
Nome: MontaOpenLayers()
Objetivo: Cria Controles, toolbar, carrega os layers criado anteriomente, etc.
Disparador(es): carregaLayerSwicher()
**********************************************************/
function MontaOpenLayers(layers) {
    //-------------


    //Seta o estado inicial dos campos de pesquisa e email
    setaCamposPesquisa();

    //Reseta o mapa
    resetaLogradouro();
    resetaQuadra();

    //Cria chamadas ao servidor no intervalo de tempo especificado em minutos
    renovaSession(5);

    //Cria variável com opções de inicialização do mapa
    var options = {
        controls: [],
        maxExtent: bounds,
        resolutions: resolucoesMapa,
        projection: projecaoMapa,
        //displayProjection: new OpenLayers.Projection('EPSG:29193'),
        units: 'm'
    };

    //Cria o mapa
    map = new OpenLayers.Map('map', options);


    //console.log(layersCargaInicialMapa);

    for (var i = 0; i < layers.length; i++) {
        for (var j = 0; j < layersCargaInicialMapa.length; j++) {
            if (layers[i].layerIndiceReal == layersCargaInicialMapa[j]) {
                map.addLayers([layers[i]]);
            }
        }
    }

    //map.addLayers(layers);

    //Criando camada vetor com estilo para quadras selecionadas
    vectorQuadrasSelecionadas = new OpenLayers.Layer.Vector("Selecionados", {
        styleMap:
new OpenLayers.Style(OpenLayers.Feature.Vector.style["select"])
    });

    //Adicionando camada vetor ao mapa
    map.addLayer(vectorQuadrasSelecionadas);


    //se não tiver mapa base configurado no LayerSwitcher, necessariamente a primeira camada deve ser mapabase
    var mapaBase;
    if (map.layers.length > 0) {
        for (var i = 0; i < map.layers.length; i++) {
            if (map.layers[i].isBaseLayer == true) {
                mapaBase = true;
                break;
            }
            else {
                mapaBase = false;
            }
        }
    }
    if (mapaBase == false) {
        map.baseLayer = map.layers[0];
    }



    //Seta todas as layers como não baseLayer (exceto a primeira)
    if (map.layers.length > 0) {
        for (var i = 1; i < map.layers.length; i++) {
            map.layers[i].setIsBaseLayer(false);
        }
    }

    //Registra eventos para exibir ampulheta enquanto carrega camadas
    /*if (layers.length > 0) {
        for (var i = 0; i < layers.length; i++) {
            map.layers[i].events.register("loadstart", this, function (e) {
                loading();
            });
            map.layers[i].events.register("loadend", this, function (e) {
                closeloading();
            });
        }
    }*/

    var lidarBboxStyle = new OpenLayers.StyleMap({
        "default": new OpenLayers.Style({
            fillOpacity: 0,
            fillColor: "#66ccff",
            strokeColor: "#ff0000",
            strokeOpacity: 0.95,
            strokeWidth: 1
        })
    });

    _BboxLidar = new OpenLayers.Layer.Vector("BboxLidar", {
        styleMap: lidarBboxStyle,
        rendererOptions: { zIndexing: true },
        renderers: ["Canvas", "SVG", "VML"]
    });



    map.addLayer(_BboxLidar);


    //Criando os controles do mapa
    var ctlDrg = new OpenLayers.Control.DragPan({ title: "Arrastar/Mover o Mapa" });
    var ctlMzoom = new OpenLayers.Control.ZoomToMaxExtent({ title: "Extensão do Mapa" });
    var ctlZoomBox = new OpenLayers.Control.ZoomBox({ title: "Janela de Zoom", alwaysZoom: true });
    //var polygonControl = new OpenLayers.Control.DrawFeature(_DrawLayer, OpenLayers.Handler.RegularPolygon, { active: true, handlerOptions: { sides: 4, irregular: true }, 'displayClass': 'olControlDrawFeaturePolygon', featureAdded: function (feat) { setStyle(feat, "Polygon") }, title: "Desenhar Retângulo" });
    var ctlBBoxLidar3D = new OpenLayers.Control.DrawFeature(_BboxLidar, OpenLayers.Handler.RegularPolygon, {
        handlerOptions: {
            sides: 4,
            snapAngle: 90,
            irregular: true,
            persist: true
        }//,
        //featureAdded: function () { mostrarDivBounds() }
    });
    ctlBBoxLidar3D.handler.callbacks.done = endDrag;
    var ctlTransform = new OpenLayers.Control.TransformFeature(_BboxLidar, {
        rotate: false,
        irregular: true
    });
    ctlTransform.events.register("transformcomplete", ctlTransform, boxResize);
    var ctlNav = new OpenLayers.Control.Navigation({ 'zoomWheelEnabled': true, 'zoomBoxEnabled': true });
    var ctlZin = new OpenLayers.Control.ZoomIn({ title: "Zoom Mais" }, { zoomInId: ".olControlPanel .olControlSelectFeatureItemActive", zoomOutId: ".olControlPanel .olControlSelectFeatureItemInactive" });
    var ctlZou = new OpenLayers.Control.ZoomOut({ title: "Zoom Menos" });
    var ctlDistancia = new OpenLayers.Control.Button({
        displayClass: "ctlMedir",
        trigger: function () { GeoSampa.Eventos.emit("medir", this); },
        title: "Medir",
        active: false
    });
    var ctlDesenho = new OpenLayers.Control.Button({
        displayClass: "ctlDesenho",
        trigger: function () { GeoSampa.Eventos.emit("desenhar", this); },
        title: "Desenho",
        active: false
    });
    var ctlImportar = new OpenLayers.Control.Button({
        displayClass: "ctlImportar",
        trigger: function () { GeoSampa.Eventos.emit("importar", this); },
        title: "Importação",
        active: false
    });
    var ctlBtnShowLayers = new OpenLayers.Control.Button({
        displayClass: "ctlBtnShowLayers",
        trigger: _controlaLayers,
        title: "Exibe Controle de Camadas"
    });

    var ctlBtnImpressao = new OpenLayers.Control.Button({
        displayClass: "ctlBtnImpressao",
        trigger: _imprimeMapaCanvas,
        title: "Imprimir"
    });

    var ctlBtnPesquisaLogradouro = new OpenLayers.Control.Button({
        displayClass: "ctlBtnPesquisaLogradouro",
        trigger: _abreFormPesquisaLogradouro,
        title: "Pesquisar"
    });

    var ctlBtnPDF = new OpenLayers.Control.Button({
        displayClass: "ctlBtnPDF",
        trigger: _abreFormPDF,
        title: "Download por seleção"
    });

    var ctlBtnCoordenadas = new OpenLayers.Control.Button({
        displayClass: "ctlBtnCoordenadas",
        trigger: _abreFormCoordenadas,
        title: "Coordenadas"
    });

    //*****************************************************************************************************************************
    //=============================================================================================================================
    //*****************************************************************************************************************************
    //=============================================================================================================================

    //CRIAR BOTAO DE PESQ. QUADRA VIARIA
    //Capturando hashcode
    var _hc = jQuery('#hc', window.parent.document).val();

    //Criando opções de para o controle do tipo "OpenLayers.Control.GetFeature"

    var wfsPesqPDFSetor_options = {
        url: 'map.geo?hc=' + _hc + '&tipoServico=DWFS1',
        params: {
            request: "GetFeature",
            service: "wfs",
            version: "1.0.0",
            typeName: NM_LAYER_QUADRA_FISCAL_WFS, //NM_LAYER_SETOR_PESQUISA_WFS,  //"DU0110_11_SBC_20:V6321_QDR_VIAR_PGW_G", //NM_NAMESPACE_LAYERS + ':' + NM_LAYER_QUADRICULAS,
            featureType: NM_LAYER_QUADRA_FISCAL_WFS, //NM_LAYER_SETOR_PESQUISA_WFS   //"DU0110_11_SBC_20:V6321_QDR_VIAR_PGW_G"
        },
        format: new OpenLayers.Format.GML({
            geometryName: NM_GEOMETRIA_QUADRA_FISCAL //NM_GEOMETRIA_SETOR //"GEOM" //NM_GEOMETRIA_QUADRICULA
        })
    };

    var ctlBtnPDFSetor = new OpenLayers.Control.GetFeature({
        protocol: new OpenLayers.Protocol.HTTP(wfsPesqPDFSetor_options),
        box: false,
        hover: false,
        toggleKey: "ctrlKey",
        title: "Visualizar Setor Fiscal"
    }
);

    //Abre PDF de quadra fiscal e marca polígono selecionado
    ctlBtnPDFSetor.events.register("featureselected", this, function (e) {
        //console.log([e.feature]);

        var set = e.feature.attributes["cd_setor_fiscal"];  //e.feature.attributes["COD_SETOR_FISCAL"];
        var quad = e.feature.attributes["cd_quadra_fiscal"]; //e.feature.attributes["COD_QUADRA_PREDIAL"];

        window.open("http://sf9402.app.prodam/intranet/frmConsultaCroquiPDF.aspx?pstrSetor=" + set, 'window' + set + quad);

        vectorQuadrasSelecionadas.addFeatures([e.feature]);
    });


    //Registrando tratamento do evento "featureunselected" para o controle "ctlBtnQuadraFiscal"
    ctlBtnPDFSetor.events.register("featureunselected", this, function (e) {
        vectorQuadrasSelecionadas.removeFeatures([e.feature]);
    });


    //*************************************************************************************************************************

    //CRIAR BOTAO DE PESQ. QUADRA VIARIA
    //Capturando hashcode

    //Criando opções de para o controle do tipo "OpenLayers.Control.GetFeature"

    var wfsPesqPDFQuadra_options = {
        url: 'map.geo?hc=' + _hc + '&tipoServico=DWFS1',
        params: {
            request: "GetFeature",
            service: "wfs",
            version: "1.0.0",
            typeName: NM_LAYER_QUADRA_FISCAL_WFS, //NM_NAMESPACE_QDR_VIAR,  //"DU0110_11_SBC_20:V6321_QDR_VIAR_PGW_G", //NM_NAMESPACE_LAYERS + ':' + NM_LAYER_QUADRICULAS,
            featureType: NM_LAYER_QUADRA_FISCAL_WFS //NM_NAMESPACE_QDR_VIAR   //"DU0110_11_SBC_20:V6321_QDR_VIAR_PGW_G"
        },
        format: new OpenLayers.Format.GML({
            geometryName: NM_GEOMETRIA_QUADRA_FISCAL //NM_GEOMETRIA_QDR_VIAR //"GEOM" //NM_GEOMETRIA_QUADRICULA
        })
    };

    var ctlBtnPDFQuadra = new OpenLayers.Control.GetFeature({
        protocol: new OpenLayers.Protocol.HTTP(wfsPesqPDFQuadra_options),
        box: false,
        hover: false,
        toggleKey: "ctrlKey",
        title: "Visualizar Quadra Fiscal"
    }
);

    //Abre PDF de quadra fiscal e marca polígono selecionado
    ctlBtnPDFQuadra.events.register("featureselected", this, function (e) {
        //console.log([e.feature]);

        var set = e.feature.attributes["cd_setor_fiscal"];
        var quad = e.feature.attributes["cd_quadra_fiscal"];

        window.open("http://sf9402.app.prodam/intranet/frmConsultaCroquiPDF.aspx?pstrSetor=" + set + "&pstrQuadra=" + quad, 'window' + set + quad);

        vectorQuadrasSelecionadas.addFeatures([e.feature]);
    });


    //Registrando tratamento do evento "featureunselected" para o controle "ctlBtnQuadraFiscal"
    ctlBtnPDFQuadra.events.register("featureunselected", this, function (e) {
        vectorQuadrasSelecionadas.removeFeatures([e.feature]);
    });

    //*****************************************************************************************************************************
    //=============================================================================================================================
    //*****************************************************************************************************************************
    //=============================================================================================================================

    //Criando camada vetor com estilo para selecionados
    vectorCamadaSelecao = new OpenLayers.Layer.Vector("Selecionados", {
        styleMap:
            new OpenLayers.Style(OpenLayers.Feature.Vector.style["select"])
    });

    //Adicionando camada vetor ao mapa
    map.addLayer(vectorCamadaSelecao);


    //Criando opções de para o controle do tipo "OpenLayers.Control.GetFeature"
    var wfs_optionsSelecao = {
        url: 'map.geo?hc=' + _hc + '&tipoServico=DWFS1',
        params: {
            request: "GetFeature",
            service: "wfs",
            version: "1.0.0",
            //typeName: NM_LAYER_SETOR_PESQUISA_WFS,
            typeName: NM_LAYER_SETOR_PESQUISA_WFS,
            featureType: NM_LAYER_SETOR_PESQUISA_WFS
        },
        format: new OpenLayers.Format.GML({
            //featureNS: NM_NAMESPACE_LAYERS,
            //featureNS: 'DU0110_12_Download_Folhas_SCM',
            geometryName: NM_GEOMETRIA_SETOR
        })
    };

    //Criando controle "ctlGetSelecao" do tipo "OpenLayers.Control.GetFeature" para seleção
    var ctlGetSelecao = new OpenLayers.Control.GetFeature({
        protocol: new OpenLayers.Protocol.HTTP(wfs_optionsSelecao),
        box: true,
        hover: false,
        multipleKey: "shiftKey",
        toggleKey: "ctrlKey",
        title: "Selecionar"
    });

    //Registrando tratamento do evento "featureselected" para o controle "ctlGetFeat"
    ctlGetSelecao.events.register("featureselected", this, function (e) {
        vectorCamadaSelecao.addFeatures([e.feature]);
    });

    //Registrando tratamento do evento "featureunselected" para o controle "ctlGetFeat"
    ctlGetSelecao.events.register("featureunselected", this, function (e) {
        vectorCamadaSelecao.removeFeatures([e.feature]);
    });


    //*****************************************************************************************************************************
    //=============================================================================================================================
    //*****************************************************************************************************************************
    //=============================================================================================================================


    //Criando camada vetor com estilo para selecionados
    vectorCamadaMapaArticulado = new OpenLayers.Layer.Vector("vectorCamadaMapaArticulado", {
        styleMap:
            new OpenLayers.Style(OpenLayers.Feature.Vector.style["select"])
    });

    //Adicionando camada vetor ao mapa
    map.addLayer(vectorCamadaMapaArticulado);


    //Criando opções de para o controle do tipo "OpenLayers.Control.GetFeature"
    var wfs_optionsMapaArticulado = {
        url: 'map.geo?hc=' + _hc + '&tipoServico=DWFS1',
        params: {
            request: "GetFeature",
            service: "wfs",
            version: "1.0.0",
            typeName: "geoportal:quadricula_orto_2001_emplasa_v2",
            featureType: "geoportal:quadricula_orto_2001_emplasa_v2"
        },
        format: new OpenLayers.Format.GML({
            geometryName: NM_GEOMETRIA_SETOR
        })
    };

    //Criando controle "ctlGetMapaArticulado" do tipo "OpenLayers.Control.GetFeature" para seleção
    var ctlGetMapaArticulado = new OpenLayers.Control.GetFeature({
        protocol: new OpenLayers.Protocol.HTTP(wfs_optionsMapaArticulado),
        box: true,
        hover: false,
        multipleKey: "shiftKey",
        toggleKey: "ctrlKey",
        title: "Selecionar"
    });

    //Registrando tratamento do evento "featureselected" para o controle "ctlGetMapaArticulado"
    ctlGetMapaArticulado.events.register("featureselected", this, function (e) {
        vectorCamadaMapaArticulado.addFeatures([e.feature]);
    });

    //Registrando tratamento do evento "featureunselected" para o controle "ctlGetMapaArticulado"
    ctlGetMapaArticulado.events.register("featureunselected", this, function (e) {
        vectorCamadaMapaArticulado.removeFeatures([e.feature]);
    });



    //*****************************************************************************************************************************
    //=============================================================================================================================
    //*****************************************************************************************************************************
    //=============================================================================================================================



    //*****************************************************************************************************************************
    //=============================================================================================================================
    //*****************************************************************************************************************************
    //=============================================================================================================================

    //Criando camada vetor com estilo para selecionados
    vectorCamadaSelecaoDown = new OpenLayers.Layer.Vector("Selecionados_Download", {
        styleMap:
            new OpenLayers.Style(OpenLayers.Feature.Vector.style["select"])
    });

    //Adicionando camada vetor ao mapa
    map.addLayer(vectorCamadaSelecaoDown);


    //Criando opções de para o controle do tipo "OpenLayers.Control.GetFeature"
    var wfs_optionsSelecaoDown = {
        url: 'map.geo?hc=' + _hc + '&tipoServico=DWFS1',
        params: {
            request: "GetFeature",
            service: "wfs",
            version: "1.0.0",
            typeName: NM_LAYER_QUADRA_FISCAL_WFS, //NM_NAMESPACE_QDR_VIAR,
            featureType: NM_LAYER_QUADRA_FISCAL_WFS //NM_NAMESPACE_QDR_VIAR
        },
        format: new OpenLayers.Format.GML({
            geometryName: NM_GEOMETRIA_QUADRA_FISCAL //NM_GEOMETRIA_QDR_VIAR
        })
    };

    //Criando controle "ctlGetSelecao" do tipo "OpenLayers.Control.GetFeature" para seleção
    var ctlGetSelecaoDown = new OpenLayers.Control.GetFeature({
        protocol: new OpenLayers.Protocol.HTTP(wfs_optionsSelecaoDown),
        box: true,
        hover: false,
        multipleKey: "shiftKey",
        toggleKey: "ctrlKey",
        title: "Selecionar",
        displayClass: "ctlGetSelecaoDown"
    });

    //Registrando tratamento do evento "featureselected" para o controle "ctlGetFeat"
    ctlGetSelecaoDown.events.register("featureselected", this, function (e) {
        vectorCamadaSelecaoDown.addFeatures([e.feature]);
        globalctlGetSelecaoDown.deactivate();
    });

    //Registrando tratamento do evento "featureunselected" para o controle "ctlGetFeat"
    ctlGetSelecaoDown.events.register("featureunselected", this, function (e) {
        vectorCamadaSelecaoDown.removeFeatures([e.feature]);
    });




    //*****************************************************************************************************************************
    //=============================================================================================================================
    //*****************************************************************************************************************************
    //=============================================================================================================================

    var ctlBtnExibeInfo = new OpenLayers.Control.Button({
        displayClass: "ctlBtnExibeInfo",
        trigger: _ativaBuscaLonLat,
        title: "Obter informação da camada"
    });


    //Controle de limpeza de seleções do mapa
    var ctlBtnLimpaSelecao = new OpenLayers.Control.Button({
        displayClass: "ctlBtnLimpaSelecao",
        trigger: _limpaSelecao,
        title: "Desfazer seleção"
    });


    var ctlBtnExibeCroqui = new OpenLayers.Control.Button({
        displayClass: "ctlBtnExibeCroqui",
        trigger: _showCroqui,
        title: "Download por atributos"
    });


    var ctlBtnSelecao = new OpenLayers.Control.Button({
        displayClass: "ctlBtnSelecao",
        trigger: _showSelecao,
        title: "Seleção"
    });

    var ctlBtnConfig = new OpenLayers.Control.Button({
        displayClass: "ctlBtnConfig",
        trigger: _showConfig,
        title: "Configurações"
    });

    var ctlBtnHelp = new OpenLayers.Control.Button({
        displayClass: "ctlBtnHelp",
        trigger: _showAjuda,
        title: "Ajuda"
    });

    var ctlBtnDownloadImagem = new OpenLayers.Control.Button({
        displayClass: "ctlBtnDownloadImagem",
        trigger: _downloadImagem,
        title: "Salvar mapa como imagem"
    });

    var ctlBtnBookmark = new OpenLayers.Control.Button({
        displayClass: "ctlBtnBookmark",
        trigger: ativaBookmark,
        title: "Bookmark"
    });

    var ctlBtnGetBBoxLidar = new OpenLayers.Control.Button({
        displayClass: "ctlBtnGetBBoxLidar",
        trigger: ativaLidar3D,
        title: "LiDAR 3D"
    });

    //Controle que captura o click no mapa para pegar informações como o LonLat. Invisível e ativado pelo ctlBtnExibeInfo
    var ctlPegaLatLon = new OpenLayers.Control.Click({
        handlerOptions: { "single": true }
    });

    var ctlNavega = new OpenLayers.Control.NavigationHistory({
        displayClass: "ctlBtnNavegacaoHistorico",
        "previousOptions": { "title": "Histórico de navegação - Voltar" },
        "nextOptions": { "title": "Histórico de navegação - Avançar" }
    });


    var ctlBtnContato = new OpenLayers.Control.Button({
        displayClass: "ctlBtnContato",
        trigger: _showContato,
        title: "Contato"
    });


    _vCoordenadaClick = new OpenLayers.Layer.Vector("CoordenadaClick", {
        styleMap: new OpenLayers.Style(OpenLayers.Feature.Vector.style["select"])
    });

    var ctlPegaLatLonCoord = new OpenLayers.Control.Click({
        handlerOptions: { "single": true },
        onClick: function (evt) {

            var projectionA = new OpenLayers.Projection("EPSG:4618");  //lat lon  numeros pequenos 23 a 76
            //var projectionB = new OpenLayers.Projection("EPSG:29193"); //sad 169 padrao x,y  acima de 1000
            var projectionB = new OpenLayers.Projection("EPSG:31983");
            var projGoogle = new OpenLayers.Projection("EPSG:4326");

            var _lonLatSelecao = map.getLonLatFromPixel(evt.xy);

            var point = new OpenLayers.LonLat(_lonLatSelecao.lon, _lonLatSelecao.lat);
            var point2 = point.transform(projectionB, projGoogle);
            var point3 = new OpenLayers.LonLat(_lonLatSelecao.lon, _lonLatSelecao.lat).transform(map.getProjectionObject(), projGoogle);

            var wformatOutput = function (lonLat) {
                var digits = parseInt(this.numDigits);
                var newHtml =
                //this.prefix +
    OpenLayers.Util.getFormattedLonLat(lonLat.lat, 'lat', 'dms') +
    ', ' + //this.separator +
    OpenLayers.Util.getFormattedLonLat(lonLat.lon, 'lon', 'dms') +
    '';
                //this.suffix;
                return newHtml;
            };

            if (_vCoordenadaClick != undefined) {
                _vCoordenadaClick.removeAllFeatures();
            }
            else {
                _vCoordenadaClick = new OpenLayers.Layer.Vector("CoordenadaClick", {
                    styleMap: new OpenLayers.Style(OpenLayers.Feature.Vector.style["select"])
                });
            }
            var _p = new OpenLayers.Geometry.Point(_lonLatSelecao.lon, _lonLatSelecao.lat);
            _vCoordenadaClick.addFeatures([new OpenLayers.Feature.Vector(_p)]);
            map.addLayer(_vCoordenadaClick);

            document.getElementById('divCoord').style.display = "block";

            document.getElementById('cdnXY').value = _lonLatSelecao.lon + ', ' + _lonLatSelecao.lat;
            document.getElementById('cdnLatLon').value = wformatOutput(point2);
            document.getElementById('cdnLatLonGoogle').value = point3.lat + ',' + point3.lon;

            document.getElementById('btnCopiar').disabled = false;

            $('div.olLayerDiv').css('cursor', 'default');

            this.deactivate();

            //_xySelecao.x + ',' + _xySelecao.y;

            //console.log(_lonLatSelecao);
            //console.log(_xySelecao);
            //console.log(point2);
        }
    });

    var ctlBtnDownloadArquivos = new OpenLayers.Control.Button({
        displayClass: "ctlBtnDownloadArquivos",
        trigger: _downloadArquivosMensagem,
        title: "Download de Arquivos"
    });

    /*
    _vMapaArticuladoQuadricula = new OpenLayers.Layer.Vector("MapaArticuladoQuadricula", {
    styleMap: new OpenLayers.Style(OpenLayers.Feature.Vector.style["select"])
    });


    //Adicionando camada vetor ao mapa
    map.addLayer(_vMapaArticuladoQuadricula);

    //Criando opções de para o controle do tipo "OpenLayers.Control.GetFeature"
    var wfs_optionsQuadriculaDown = {
    url: 'map.geo?hc=' + _hc + '&tipoServico=DWFS1',
    params: {
    request: "GetFeature",
    service: "wfs",
    version: "1.0.0",
    typeName: NM_LAYER_MAPA_ARTICULADO_QUADRICULA_WFS,
    featureType: NM_LAYER_MAPA_ARTICULADO_QUADRICULA_WFS
    },
    format: new OpenLayers.Format.GML({
    geometryName: NM_GEOMETRIA_MAPA_ARTICULADO
    })
    };

    //Criando controle "ctlGetSelecao" do tipo "OpenLayers.Control.GetFeature" para seleção
    var ctlGetQuadriculaDown = new OpenLayers.Control.GetFeature({
    protocol: new OpenLayers.Protocol.HTTP(wfs_optionsQuadriculaDown),
    box: true,
    hover: false,
    multipleKey: "shiftKey",
    toggleKey: "ctrlKey",
    title: "Selecionar",
    displayClass: "ctlGetQuadriculaDown"
    });

    //Registrando tratamento do evento "featureselected" para o controle "ctlGetFeat"
    ctlGetQuadriculaDown.events.register("featureselected", this, function (e) {
    _vMapaArticuladoQuadricula.addFeatures([e.feature]);
    });

    //Registrando tratamento do evento "featureunselected" para o controle "ctlGetFeat"
    ctlGetQuadriculaDown.events.register("featureunselected", this, function (e) {
    _vMapaArticuladoQuadricula.removeFeatures([e.feature]);
    });

    _vMapaArticuladoQuadricula.events.register("featureclick", this, function (e) {
    console.log(e.feature.data);
    });
    */


    //**********************************************************************************************
    //****************************** DOWNLOAD MAPA ARTICULADO **************************************
    //**********************************************************************************************
    ativaSelecaoDownload = function () {

        //Reseta o mapa
        _limpaSelecao();
        inativaPesqLogr();

        var _camada = arrCamadas[$("#cboTipoMapaArticulado").val()];
        var arrLevantamentos = _camada.Levantamentos;


        var typeNameLoc;
        var featureTypeLoc;

        typeNameLoc = _camada.Camadas[0]; //"geoportal:quadricula_foto_aerea_1940_v2";
        featureTypeLoc = _camada.Camadas[0] //"geoportal:quadricula_foto_aerea_1940_v2";

        globalctlGetMapaArticulado.protocol.params.typeName = typeNameLoc;
        globalctlGetMapaArticulado.protocol.params.featureType = featureTypeLoc;
        globalctlGetMapaArticulado.activate();

    }

    ativaDownloadArquivo = function () {
        globalctlGetMapaArticulado.deactivate();
        $('div.olLayerDiv').css('cursor', 'default');
        //LayerSelecaoMapaArticulado.events.register("featureclick", this, function (e) {

        //console.log(LayerSelecaoMapaArticulado);
        var strHTMLifr = "<iframe id=_ifrDown name=_ifrDown width=0 height=0 border=0></iframe>";
        var strLinkHTML = '';
        var feats = vectorCamadaMapaArticulado.features;

        var folhasStrJson = "["; //1
        for (var k = 0; k < feats.length; k++) {

            var feat = feats[k];
            //var feat = vectorCamadaMapaArticulado.features[0]; //e.feature;
            var _cd_quadricula = feat.attributes['cd_quadricula'];
            var _cd_levantamento = feat.attributes['cd_levantamento'];
            var _camada = arrCamadas[$("#cboTipoMapaArticulado").val()];
            var _nm_pasta = _camada.Pasta;
            var _padrao_arquivo = _camada.PadraoArquivo;
            var _nm_arquivo = _padrao_arquivo.replace('$$$', _cd_quadricula);

            var _escala = _camada.Escalas[_camada.Levantamentos.indexOf(parseInt(_cd_levantamento, 10))];
            var _strEscala = (_escala != '') ? '&nbsp;(' + _escala + ')' : '';
            var _lev = parseInt(_cd_levantamento, 10);

            if ($("#cboTipoMapaArticulado").val() == '10') {
                var _prefix_orto_2004 = (_lev == 11) ? '1O_' : (_lev == 12) ? '5O_' : '';
                _nm_arquivo = _prefix_orto_2004 + _nm_arquivo;
            }
            _nm_arquivo = (_lev == 10) ? _nm_arquivo.toUpperCase() : _nm_arquivo;
            //console.log(_nm_arquivo);


            var arrSCM = (new String(_cd_quadricula + ';')).split(';');
            if ($("#cboTipoMapaArticulado").val() == '15') {

                for (var i = 0; i < arrSCM.length - 1; i++) {
                    strLinkHTML = "<a class=down target=_ifrDown href=downloadIfr.aspx?orig=DownloadQuadriculas&arq=" + arrSCM[i] + "&arqTipo=PDF>PDF</a>";
                    strLinkHTML += "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<a class=down target=_ifrDown href=downloadIfr.aspx?orig=DownloadQuadriculas&arq=" + arrSCM[i] + "&arqTipo=DXF>DXF (zip)</a>";
                    strLinkHTML += "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<a class=down target=_ifrDown href=downloadIfr.aspx?orig=DownloadQuadriculas&arq=" + arrSCM[i] + "&arqTipo=MDT>MDT DXF (zip)</a>";
                    folhasStrJson += " { FolhaSCM: \"" + arrSCM[i] + "\", Links: \"" + strLinkHTML + "\" },";
                }
            } else if ($("#cboTipoMapaArticulado").val() == '16') { //MDT                     
                for (var i = 0; i < arrSCM.length - 1; i++) {
                    strLinkHTML = "<a class=down target=_ifrDown href=downloadIfr.aspx?orig=DownloadMapaArticulacao&arq=" + escape(_nm_pasta + "\\" + _nm_arquivo) + "&arqTipo=MAPA_ARTICULACAO>ZIP</a>";
                    strLinkHTML += "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<a class=down target=blank href=https://visualizador-laz-web.s3-sa-east-1.amazonaws.com/index.html?mdt=1&scm=" + arrSCM[i] + ">Visualizador Web</a>";
                    folhasStrJson += " { FolhaSCM: \"" + arrSCM[i] + "\", Links: \"" + strLinkHTML + "\" },";
                }
            } else if ($("#cboTipoMapaArticulado").val() == '17') { //MDS

                for (var i = 0; i < arrSCM.length - 1; i++) {
                    strLinkHTML = "<a class=down target=_ifrDown href=downloadIfr.aspx?orig=DownloadMDSLAZ&arq=" + escape(_nm_pasta + "\\" + _nm_arquivo) + "&arqTipo=LAZ>LAZ</a>";
                    strLinkHTML += "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<a class=down href=https://laz-m3dc-pmsp.s3-sa-east-1.amazonaws.com/MDS_color_" + arrSCM[i] + ".laz>LAZ(color)</a>";
                    strLinkHTML += "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<a class=down target=blank href=https://github.com/geoinfo-smdu/metadados-MDS/tree/master/MDS/" + arrSCM[i] + ">Metadados</a>";
                    strLinkHTML += "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<a class=down target=blank href=https://visualizador-laz-web.s3-sa-east-1.amazonaws.com/index.html?scm=" + arrSCM[i] + ">Visualiz. Web</a>";
                    folhasStrJson += " { FolhaSCM: \"" + arrSCM[i] + "\", Links: \"" + strLinkHTML + "\" },";
                    painelMensagemVisualizadorLAZ();
                }
            }
            else {
                for (var i = 0; i < arrSCM.length - 1; i++) {
                    strLinkHTML = "<a class=down target=_ifrDown href=downloadIfr.aspx?orig=DownloadMapaArticulacao&arq=" + escape(_nm_pasta + "\\" + _nm_arquivo) + "&arqTipo=MAPA_ARTICULACAO>" + _nm_arquivo + _strEscala + "</a>&nbsp;&nbsp;";
                    folhasStrJson += " { FolhaSCM: \"" + arrSCM[i] + "\", Links: \"" + strLinkHTML + "\" },";
                }
            }

        }

        folhasStrJson = folhasStrJson.substring(0, folhasStrJson.length - 1);
        folhasStrJson += "]";
        folhasStrJson = eval(folhasStrJson);
        debug = folhasStrJson;


        //jQuery('#divArquivos').html(strHTMLDiv + strHTMLifr);

        jQuery('#divDownloadArquivos').show();


        //Prepara os elementos HTML para montagem do grid   
        var rnd = (Math.random()).toString().replace('.', '').substring(0, 5);
        var idT = 'T_' + rnd;
        var idP = 'P_' + rnd;

        var strHTMLtbl = "<table id=" + idT + "></table>";
        var strHTMLpgr = "<div id=" + idP + "></div>";

        var strHTMLDiv = "<div id='divComboCamadas'>" + strHTMLtbl + strHTMLpgr + strHTMLifr + "</div>";

        //var strHTMLifr = "<iframe id=ifrDown name=ifrDown width=0 height=0 border=0></iframe>";
        jQuery('#divArquivos').html(strHTMLDiv);
        //jQuery('#divArquivos2').html('');
        //jQuery('#divArquivos3').html('');
        //jQuery('#lblPopup').html('Lista de Folhas');

        var grid = jQuery('#' + idT);
        debug = grid;

        //Função que instancia o componente jqGrid
        carregaGridFolhas = function () {
            //console.log(folhasStrJson);
            grid.jqGrid({
                datatype: "local",
                data: folhasStrJson,
                height: "auto",
                colNames: ['Faixa de voo', 'Download'],
                colModel: [
                        { name: 'FolhaSCM', index: 'FolhaSCM', width: '80', sortable: false },
                        { name: 'Links', index: 'Links', width: '350', title: false, sortable: false }
                ],
                multiselect: false,
                caption: "",
                pager: idP, //'#pagerFolhas',
                rowNum: 10,
                //rowList: [10, 20, 30],
                localReader: { repeatitems: true },
                viewrecords: false,
                gridview: true,
                autowidth: false,
                ignoreCase: true,
                loadonce: false,
                loadError: function (xhr, st, err) {
                    //console.log("Type: " + st + "; Response: " + xhr.status + " " + xhr.statusText);
                },
                loadComplete: function () {
                    //console.log(this);
                }
            });
        }
        //Chamada da função que monta e exibe o grid
        carregaGridFolhas();
    };


    //**********************************************************************************************
    //******************************FIM DOWNLOAD MAPA ARTICULADO ***********************************
    //**********************************************************************************************

    /*
    var strLinkHTMLArquivos = "";
    var ctlGetQuadriculaLatLon = new OpenLayers.Control.Click({
        handlerOptions: { "single": true },
        onClick: function (evt) {

            //Reseta o mapa
            _limpaSelecao();

            inativaPesqLogr();

            var _lonLatSelecao = map.getLonLatFromPixel(evt.xy);

            //_xySelecao.x + ',' + _xySelecao.y;

            //console.log(_lonLatSelecao);
            //console.log(_xySelecao);
            //console.log(point2);

            var _camada = arrCamadas[$("#cboTipoMapaArticulado").val()];
            var arrLevantamentos = _camada.Levantamentos;

            //console.log(arrLevantamentos);

            var wfs_optionsQuadriculaDown = {
                url: 'map.geo?hc=' + _hc + '&tipoServico=DWFS1',
                params: {
                    request: "GetFeature",
                    service: "wfs",
                    version: "1.0.0",
                    typeName: NM_LAYER_MAPA_ARTICULADO_QUADRICULA_WFS,
                    featureType: NM_LAYER_MAPA_ARTICULADO_QUADRICULA_WFS,
                    cql_filter: "cd_levantamento IN (" + arrLevantamentos.join() + ") AND INTERSECTS(" + NM_GEOMETRIA_MAPA_ARTICULADO + ",POINT(" + _lonLatSelecao.lon + " " + _lonLatSelecao.lat + "))"
                },
                format: new OpenLayers.Format.GML({
                    geometryName: NM_GEOMETRIA_MAPA_ARTICULADO
                })
            };


            LayerSelecaoMapaArticulado = new OpenLayers.Layer.Vector("LayerSelecaoMapaArticulado", {
                strategies: [new OpenLayers.Strategy.Fixed()],
                protocol: new OpenLayers.Protocol.HTTP(wfs_optionsQuadriculaDown),
                styleMap: new OpenLayers.Style(OpenLayers.Feature.Vector.style["select"])
            });

            map.addLayer(LayerSelecaoMapaArticulado);*/
    /*
    LayerSelecaoMapaArticulado.events.register("featuresadded", this, function (e) {


    strLinkHTMLArquivos = "";
    var feats = e.features;
    for (var i = 0; i < feats.length; i++) {

    var feat = feats[i];
    var _cd_quadricula = feat.attributes['cd_quadricula'];
    var _camada = arrCamadas[$("#cboTipoMapaArticulado").val()];
    var _nm_pasta = _camada.Pasta;
    var _padrao_arquivo = _camada.PadraoArquivo;
    var _nm_arquivo = _padrao_arquivo.replace('$$$', _cd_quadricula);
    var _lev = parseInt(feat.attributes['cd_levantamento'], 10);
    var _prefix_orto_2004 = (_lev == 11) ? '1O_' : (_lev == 12) ? '5O_' : '';
    _nm_arquivo = _prefix_orto_2004 + _nm_arquivo;
    _nm_arquivo = (_lev == 10) ? _nm_arquivo.toUpperCase() : _nm_arquivo;

    var _escala = _camada.Escalas[_camada.Levantamentos.indexOf(parseInt(feat.attributes['cd_levantamento'], 10))];
    var _strEscala = (_escala != '') ? '&nbsp;(' + _escala + ')' : '';
    strLinkHTMLArquivos += "<a class=down target=_ifrDown href=downloadIfr.aspx?orig=DownloadMapaArticulacao&arq=" + escape(_nm_pasta + "\\" + _nm_arquivo) + "&arqTipo=MAPA_ARTICULACAO>" + _nm_arquivo + _strEscala + "</a>&nbsp;&nbsp;";
    }
    var strHTMLifr = "<iframe id=_ifrDown name=_ifrDown width=0 height=0 border=0></iframe>";
    var strHTMLDiv = "<div id='divArquivosQuadriculas'>" + strLinkHTMLArquivos + "</div>";
    jQuery('#divArquivos').html(strHTMLDiv + strHTMLifr);


    });

    LayerSelecaoMapaArticulado.events.register("featureclick", this, function (e) {
    console.log(e.feature);
    jQuery('#divDownloadArquivos').show();
    });
    */
    /*
    _featureclick = function () {
        //console.log(LayerSelecaoMapaArticulado);
        //console.log(Math.random());

        //LayerSelecaoMapaArticulado.events.register("featureclick", this, function (e) {

        //console.log(LayerSelecaoMapaArticulado);
        var strHTMLifr = "<iframe id=_ifrDown name=_ifrDown width=0 height=0 border=0></iframe>";
        var strLinkHTML = '';
        var feats = LayerSelecaoMapaArticulado.features;
        for (var k = 0; k < feats.length; k++) {

            var feat = feats[k];
            //var feat = LayerSelecaoMapaArticulado.features[0]; //e.feature;
            var _cd_quadricula = feat.attributes['cd_quadricula'];
            var _cd_levantamento = feat.attributes['cd_levantamento'];
            var _camada = arrCamadas[$("#cboTipoMapaArticulado").val()];
            var _nm_pasta = _camada.Pasta;
            var _padrao_arquivo = _camada.PadraoArquivo;
            var _nm_arquivo = _padrao_arquivo.replace('$$$', _cd_quadricula);

            var _escala = _camada.Escalas[_camada.Levantamentos.indexOf(parseInt(_cd_levantamento, 10))];
            var _strEscala = (_escala != '') ? '&nbsp;(' + _escala + ')' : '';
            var _lev = parseInt(_cd_levantamento, 10);

            if ($("#cboTipoMapaArticulado").val() == '8') {
                var _prefix_orto_2004 = (_lev == 11) ? '1O_' : (_lev == 12) ? '5O_' : '';
                _nm_arquivo = _prefix_orto_2004 + _nm_arquivo;
            }
            _nm_arquivo = (_lev == 10) ? _nm_arquivo.toUpperCase() : _nm_arquivo;
            //console.log(_nm_arquivo);

            if ($("#cboTipoMapaArticulado").val() == '10') {
                var arrSCM = (new String(_cd_quadricula + ';')).split(';');
                for (var i = 0; i < arrSCM.length - 1; i++) {
                    strLinkHTML = "<a class=down target=_ifrDown href=downloadIfr.aspx?orig=DownloadQuadriculas&arq=" + arrSCM[i] + "&arqTipo=PDF>PDF</a>";
                    strLinkHTML += "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<a class=down target=_ifrDown href=downloadIfr.aspx?orig=DownloadQuadriculas&arq=" + arrSCM[i] + "&arqTipo=DXF>DXF (zip)</a>";
                    strLinkHTML += "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<a class=down target=_ifrDown href=downloadIfr.aspx?orig=DownloadQuadriculas&arq=" + arrSCM[i] + "&arqTipo=MDT>MDT DXF (zip)</a>";
                }
            }
            else {
                strLinkHTML += "<a class=down target=_ifrDown href=downloadIfr.aspx?orig=DownloadMapaArticulacao&arq=" + escape(_nm_pasta + "\\" + _nm_arquivo) + "&arqTipo=MAPA_ARTICULACAO>" + _nm_arquivo + _strEscala + "</a>&nbsp;&nbsp;";
            }
        }
        var strHTMLDiv = "<div id='divComboCamadas'>" + strLinkHTML + "</div>";

        jQuery('#divArquivos').html(strHTMLDiv + strHTMLifr);

        jQuery('#divDownloadArquivos').show();

        //console.log(layerQuadriculaSelect.features[0]);

        //});

    }
    *//*
                                var _selectFeature = new OpenLayers.Control.SelectFeature(
                                                    LayerSelecaoMapaArticulado,
                                                    {
                                                        onSelect: _featureclick,
                                                        autoActivate: true
                                                    }
                                                );
                                map.addControl(_selectFeature);


                                globalctlGetQuadriculaLatLon.deactivate();
                            }
                        });*/



    var ctlGetAreaPublicaLatLon = new OpenLayers.Control.Click({
        handlerOptions: { "single": true },
        onClick: function (evt) {

            //Reseta o mapa
            _limpaSelecao();

            inativaPesqLogr();

            var _lonLatSelecao = map.getLonLatFromPixel(evt.xy);

            //_xySelecao.x + ',' + _xySelecao.y;

            //console.log(_lonLatSelecao);
            //console.log(_xySelecao);
            //console.log(point2);


            var wfs_optionsAreaPublicaDown = {
                url: 'map.geo?hc=' + _hc + '&tipoServico=WFS_EXTERNO_GEOPATRI',
                params: {
                    request: "GetFeature",
                    service: "wfs",
                    version: "1.0.0",
                    typeName: NM_LAYER_AREA_PUBLICA_WFS,
                    featureType: NM_LAYER_AREA_PUBLICA_WFS,
                    cql_filter: "INTERSECTS(" + NM_GEOMETRIA_AREA_PUBLICA + ",POINT(" + _lonLatSelecao.lon + " " + _lonLatSelecao.lat + "))"
                },
                format: new OpenLayers.Format.GML({
                    geometryName: NM_GEOMETRIA_AREA_PUBLICA
                })
            };


            LayerSelecaoAreaPublica = new OpenLayers.Layer.Vector("LayerSelecaoAreaPublica", {
                strategies: [new OpenLayers.Strategy.Fixed()],
                protocol: new OpenLayers.Protocol.HTTP(wfs_optionsAreaPublicaDown),
                styleMap: new OpenLayers.Style(OpenLayers.Feature.Vector.style["select"])
            });

            map.addLayer(LayerSelecaoAreaPublica);

            LayerSelecaoAreaPublica.events.register("featureadded", this, function (e) {

                var feat = e.feature;
                var strNmPDF = ("000000" + feat.attributes['cd_cadastro_area_publica']).slice(-6);
                var _nm_arquivo = strNmPDF + '.zip';
                //console.log(_nm_arquivo);

                var strHTMLifr = "<iframe id=_ifrDown name=_ifrDown width=0 height=0 border=0></iframe>";

                var strLinkHTML = "<a class=down target=_ifrDown href=downloadIfr.aspx?orig=DownloadAreaPublicaGEOPATRI&arq=" + escape(_nm_arquivo) + "&arqTipo=AREA_PUBLICA_GEOPATRI>" + _nm_arquivo + "</a>";

                var strHTMLDiv = "<div id='divComboCamadas'>" + strLinkHTML + "</div>";

                jQuery('#divArquivos').html(strHTMLDiv + strHTMLifr);

            });

            LayerSelecaoAreaPublica.events.register("featureclick", this, function (e) {
                //console.log(e.feature);
                jQuery('#divDownloadArquivos').show();
            });

            globalctlGetAreaPublicaLatLon.deactivate();
            $('div.olLayerDiv').css('cursor', 'default');
        }
    });


    var ctlGetLoteamentoLatLon = new OpenLayers.Control.Click({
        handlerOptions: { "single": true },
        onClick: function (evt) {

            //Reseta o mapa
            _limpaSelecao();

            inativaPesqLogr();

            var _lonLatSelecao = map.getLonLatFromPixel(evt.xy);

            //_xySelecao.x + ',' + _xySelecao.y;

            //console.log(_lonLatSelecao);
            //console.log(_xySelecao);
            //console.log(point2);


            var wfs_optionsLoteamentoDown = {
                url: 'map.geo?hc=' + _hc + '&tipoServico=WFS_EXTERNO_GEOPATRI',
                params: {
                    request: "GetFeature",
                    service: "wfs",
                    version: "1.0.0",
                    typeName: NM_LAYER_LOTEAMENTO_CROQUI_AREA_WFS,
                    featureType: NM_LAYER_LOTEAMENTO_CROQUI_AREA_WFS,
                    cql_filter: "INTERSECTS(" + NM_GEOMETRIA_LOTEAMENTO_CROQUI_AREA + ",POINT(" + _lonLatSelecao.lon + " " + _lonLatSelecao.lat + "))"
                },
                format: new OpenLayers.Format.GML({
                    geometryName: NM_GEOMETRIA_LOTEAMENTO_CROQUI_AREA
                })
            };


            LayerSelecaoLoteamento = new OpenLayers.Layer.Vector("LayerSelecaoLoteamento", {
                strategies: [new OpenLayers.Strategy.Fixed()],
                protocol: new OpenLayers.Protocol.HTTP(wfs_optionsLoteamentoDown),
                styleMap: new OpenLayers.Style(OpenLayers.Feature.Vector.style["select"])
            });

            map.addLayer(LayerSelecaoLoteamento);

            LayerSelecaoLoteamento.events.register("featureadded", this, function (e) {


                var feat = e.feature;
                var strNmPDF = feat.attributes['nr_croqui'] + '.pdf';
                var _nm_arquivo = strNmPDF;
                //console.log(_nm_arquivo);

                var strHTMLifr = "<iframe id=_ifrDown name=_ifrDown width=0 height=0 border=0></iframe>";

                var strLinkHTML = "<a class=down target=_ifrDown href=downloadIfr.aspx?orig=DownloadCroquiGEOPATRI&arq=" + escape(_nm_arquivo) + "&arqTipo=CROQUI_GEOPATRI>" + _nm_arquivo + "</a>";

                var strHTMLDiv = "<div id='divComboCamadas'>" + strLinkHTML + "</div>";

                jQuery('#divArquivos').html(strHTMLDiv + strHTMLifr);

            });

            LayerSelecaoLoteamento.events.register("featureclick", this, function (e) {
                //console.log(e.feature);
                jQuery('#divDownloadArquivos').show();
            });

            globalctlGetLoteamentoLatLon.deactivate();
            $('div.olLayerDiv').css('cursor', 'default');
        }
    });


    var ctlGetAreaCedidaLatLon = new OpenLayers.Control.Click({
        handlerOptions: { "single": true },
        onClick: function (evt) {

            //Reseta o mapa
            _limpaSelecao();

            inativaPesqLogr();

            var _lonLatSelecao = map.getLonLatFromPixel(evt.xy);

            //_xySelecao.x + ',' + _xySelecao.y;

            //console.log(_lonLatSelecao);
            //console.log(_xySelecao);
            //console.log(point2);


            var wfs_optionsAreaCedidaDown = {
                url: 'map.geo?hc=' + _hc + '&tipoServico=WFS_EXTERNO_GEOPATRI',
                params: {
                    request: "GetFeature",
                    service: "wfs",
                    version: "1.0.0",
                    typeName: NM_LAYER_AREA_CEDIDA_WFS,
                    featureType: NM_LAYER_AREA_CEDIDA_WFS,
                    cql_filter: "INTERSECTS(" + NM_GEOMETRIA_AREA_CEDIDA + ",POINT(" + _lonLatSelecao.lon + " " + _lonLatSelecao.lat + "))"
                },
                format: new OpenLayers.Format.GML({
                    geometryName: NM_GEOMETRIA_AREA_CEDIDA
                })
            };


            LayerSelecaoAreaCedida = new OpenLayers.Layer.Vector("LayerSelecaoAreaCedida", {
                strategies: [new OpenLayers.Strategy.Fixed()],
                protocol: new OpenLayers.Protocol.HTTP(wfs_optionsAreaCedidaDown),
                styleMap: new OpenLayers.Style(OpenLayers.Feature.Vector.style["select"])
            });

            map.addLayer(LayerSelecaoAreaCedida);

            LayerSelecaoAreaCedida.events.register("featureadded", this, function (e) {


                var feat = e.feature;
                var strNmPDF = feat.attributes['cd_auto_cessao'] + '.zip';
                var _nm_arquivo = strNmPDF;
                //console.log(_nm_arquivo);

                var strHTMLifr = "<iframe id=_ifrDown name=_ifrDown width=0 height=0 border=0></iframe>";

                var strLinkHTML = "<a class=down target=_ifrDown href=downloadIfr.aspx?orig=DownloadAreaCedidaGEOPATRI&arq=" + escape(_nm_arquivo) + "&arqTipo=AREA_CEDIDA_GEOPATRI>" + _nm_arquivo + "</a>";

                var strHTMLDiv = "<div id='divComboCamadas'>" + strLinkHTML + "</div>";

                jQuery('#divArquivos').html(strHTMLDiv + strHTMLifr);

            });

            LayerSelecaoAreaCedida.events.register("featureclick", this, function (e) {
                //console.log(e.feature);
                jQuery('#divDownloadArquivos').show();
            });

            globalctlGetAreaCedidaLatLon.deactivate();
            $('div.olLayerDiv').css('cursor', 'default');
        }
    });


    var ctlGetPlantaDISDUPLatLon = new OpenLayers.Control.Click({
        handlerOptions: { "single": true },
        onClick: function (evt) {

            //Reseta o mapa
            _limpaSelecao();

            inativaPesqLogr();

            var _lonLatSelecao = map.getLonLatFromPixel(evt.xy);

            //_xySelecao.x + ',' + _xySelecao.y;

            //console.log(_lonLatSelecao);
            //console.log(_xySelecao);
            //console.log(point2);


            var wfs_optionsPlantaDISDUPDown = {
                url: 'map.geo?hc=' + _hc + '&tipoServico=DWFS1',
                params: {
                    request: "GetFeature",
                    service: "wfs",
                    version: "1.0.0",
                    typeName: NM_LAYER_PLANTA_DIS_DUP_WFS,
                    featureType: NM_LAYER_PLANTA_DIS_DUP_WFS,
                    cql_filter: "INTERSECTS(" + NM_GEOMETRIA_PLANTA_DIS_DUP + ",POINT(" + _lonLatSelecao.lon + " " + _lonLatSelecao.lat + "))"
                },
                format: new OpenLayers.Format.GML({
                    geometryName: NM_GEOMETRIA_PLANTA_DIS_DUP
                })
            };


            LayerSelecaoPlantaDISDUP = new OpenLayers.Layer.Vector("LayerSelecaoPlantaDISDUP", {
                strategies: [new OpenLayers.Strategy.Fixed()],
                protocol: new OpenLayers.Protocol.HTTP(wfs_optionsPlantaDISDUPDown),
                styleMap: new OpenLayers.Style(OpenLayers.Feature.Vector.style["select"])
            });

            map.addLayer(LayerSelecaoPlantaDISDUP);

            LayerSelecaoPlantaDISDUP.events.register("featureadded", this, function (e) {

                //caso haja sobreposição de plantas DIS DUP, consideramos somente uma para seleção
                if (LayerSelecaoPlantaDISDUP.features.length > 1) {
                    for (i = 0; i < LayerSelecaoPlantaDISDUP.features.length - 1; i++) {
                        LayerSelecaoPlantaDISDUP.removeFeatures(LayerSelecaoPlantaDISDUP.features[i])
                    }
                }


                var feat = e.feature;
                var strNmPDF = feat.attributes['nm_planta_desap'] + '_' + feat.attributes['sg_tipo_formato'].trim() + '.pdf';
                var _nm_arquivo = strNmPDF;
                //console.log(_nm_arquivo);

                var strHTMLifr = "<iframe id=_ifrDown name=_ifrDown width=0 height=0 border=0></iframe>";

                var strLinkDecreto = "<br><br><a class=down target=_blank href=" + feat.attributes['tx_caminho_decreto'] + ">Clique aqui para acessar o decreto</a>";

                var strLinkHTML = "<a class=down target=_ifrDown href=downloadIfr.aspx?orig=DownloadPlantaDISDUP&arq=" + escape(_nm_arquivo) + "&arqTipo=DIS_DUP>" + _nm_arquivo + "</a>";

                var strMensagemHTML = "<br><br><br><label class=fonteMsgRedIntegracao>1. Delimitação do perímetro aproximado objeto da planta de Decreto de Utilidade Pública (DUP) ou de Decreto de Interesse Social (DIS) incidentes sobre a área consultada;<br><br>2. Sempre visualizar a imagem da planta e o texto do decreto;<br><br>3. Para saber se efetivamente uma ação de desapropriação teve prosseguimento e foi ajuizada, é necessário consultar o Departamento de Desapropriações - DESAP.</label>";

                var strHTMLDiv = "<div id='divComboCamadas'>" + strLinkHTML + strLinkDecreto + strMensagemHTML + "</div>";

                jQuery('#divArquivos').html(strHTMLDiv + strHTMLifr);

            });

            LayerSelecaoPlantaDISDUP.events.register("featureclick", this, function (e) {
                //console.log(e.feature);
                jQuery('#divDownloadArquivos').show();
            });

            globalctlGetPlantaDISDUPLatLon.deactivate();
            $('div.olLayerDiv').css('cursor', 'default');
        }
    });


    //var ctlnav = new OpenLayers.Control.NavigationHistory();

    //Criando painel com todos os controles criados
    //var panelControls = [ctlDrg, ctlZin, ctlZou, ctlZoomBox, ctlMzoom, ctlDistancia, ctlBtnPDF, ctlBtnExibeCroqui, ctlBtnShowLayers, ctlBtnImpressao, ctlBtnPesquisaLogradouro, ctlBtnExibeInfo, ctlBtnLimpaSelecao, ctlBtnSelecao, ctlBtnConfig, ctlBtnHelp, ctlPegaLatLon, ctlBtnPDFSetor, ctlBtnPDFQuadra, ctlGetSelecao];
    //var panelControls = [ctlDrg, ctlZin, ctlZou, ctlZoomBox, ctlMzoom, ctlDistancia, ctlBtnPDF, ctlBtnExibeCroqui, ctlBtnShowLayers, ctlBtnImpressao, ctlBtnPesquisaLogradouro, ctlBtnExibeInfo, ctlBtnLimpaSelecao, ctlBtnSelecao, ctlBtnConfig, ctlNavega.previous, ctlBtnHelp, ctlPegaLatLon, ctlBtnPDFSetor, ctlBtnPDFQuadra, ctlGetSelecao];
    //var panelControls = [ctlDrg, ctlZin, ctlZou, ctlZoomBox, ctlMzoom, ctlDistancia, ctlBtnPDF, ctlBtnExibeCroqui, ctlBtnShowLayers, ctlBtnImpressao, ctlBtnPesquisaLogradouro, ctlBtnExibeInfo, ctlBtnLimpaSelecao, ctlBtnSelecao, ctlBtnConfig, ctlNavega.previous, ctlBtnHelp, ctlBtnDownloadImagem, ctlBtnBookmark, ctlPegaLatLon, ctlBtnPDFSetor, ctlBtnPDFQuadra, ctlGetSelecao];
    var panelControls = [//ctlDrg,
                         ctlZin,
                         ctlZou,
                         //ctlZoomBox,
                         //ctlMzoom,
                         //ctlNavega.previous,
                         //ctlNavega.next,
                         //ctlBtnBookmark,
                         ctlBtnShowLayers,
                         ctlBtnExibeInfo,
                         //ctlBtnSelecao,
                         ctlBtnLimpaSelecao,
                         ctlBtnPesquisaLogradouro,
                         //ctlBtnPDF,
                         //ctlBtnExibeCroqui,
                         ctlBtnDownloadArquivos,
                         ctlBtnDownloadImagem,
                         ctlDistancia,
                         ctlDesenho,
                         ctlImportar,
                         ctlBtnGetBBoxLidar,
                         ctlBtnCoordenadas,
                         ctlBtnImpressao,
                         ctlBtnConfig,
                         ctlBtnHelp,
                         ctlBtnContato,
                         ctlPegaLatLon,
                         ctlBtnPDFSetor,
                         ctlBtnPDFQuadra,
                         ctlGetSelecao,
                         ctlNav,
                         ctlPegaLatLonCoord,
                         ctlGetSelecaoDown,
                         //ctlGetQuadriculaDown,
                         //ctlGetQuadriculaLatLon,
                         ctlGetAreaPublicaLatLon,
                         ctlGetLoteamentoLatLon,
                         ctlGetAreaCedidaLatLon,
                         ctlGetPlantaDISDUPLatLon,
                         ctlGetMapaArticulado];


    //Joga os controles nas globais
    globalctlDrg = ctlDrg;
    globalctlZin = ctlZin;
    globalctlZou = ctlZou;
    globalctlZoomBox = ctlZoomBox;
    globalctlBtnGetBBoxLidar = ctlBtnGetBBoxLidar;
    globalctlTransform = ctlTransform;
    globalctlBBoxLidar3D = ctlBBoxLidar3D;
    globalctlMzoom = ctlMzoom;
    globalctlDistancia = ctlDistancia;
    globalctlDesenho = ctlDesenho;
    globalctlImportar = ctlImportar;
    //globalctlBtnQuadraFiscal = ctlBtnQuadraFiscal;
    globalctlBtnPDF = ctlBtnPDF;
    globalctlBtnPDFSetor = ctlBtnPDFSetor;
    globalctlBtnPDFQuadra = ctlBtnPDFQuadra;
    globalctlBtnShowLayers = ctlBtnShowLayers;
    globalctlBtnImpressao = ctlBtnImpressao;
    globalctlBtnPesquisaLogradouro = ctlBtnPesquisaLogradouro;
    globalctlBtnExibeInfo = ctlBtnExibeInfo;
    globalctlBtnLimpaSelecao = ctlBtnLimpaSelecao;
    globalctlPegaLatLon = ctlPegaLatLon;
    globalctlBtnExibeCroqui = ctlBtnExibeCroqui;
    globalctlBtnSelecao = ctlBtnSelecao;
    globalctlBtnConfig = ctlBtnConfig;
    globalctlBtnHelp = ctlBtnHelp;
    globalctlGetSelecao = ctlGetSelecao;
    globalctlNavega = ctlNavega;
    globalctlBtnDownloadImagem = ctlBtnDownloadImagem;
    globalctlBtnBookmark = ctlBtnBookmark;
    globalctlBtnContato = ctlBtnContato;
    globalctlNav = ctlNav;
    globalctlBtnCoordenadas = ctlBtnCoordenadas;
    globalctlPegaLatLonCoord = ctlPegaLatLonCoord;
    globalctlBtnDownloadArquivos = ctlBtnDownloadArquivos;
    globalctlGetSelecaoDown = ctlGetSelecaoDown;
    //globalctlGetQuadriculaDown = ctlGetQuadriculaDown;
    //globalctlGetQuadriculaLatLon = ctlGetQuadriculaLatLon;
    globalctlGetAreaPublicaLatLon = ctlGetAreaPublicaLatLon;
    globalctlGetLoteamentoLatLon = ctlGetLoteamentoLatLon;
    globalctlGetAreaCedidaLatLon = ctlGetAreaCedidaLatLon;
    globalctlGetPlantaDISDUPLatLon = ctlGetPlantaDISDUPLatLon;
    globalctlGetMapaArticulado = ctlGetMapaArticulado;


    var _activateAControl = function (handler) {
        var _except = handler.object;
        GeoSampa.Druid.tellsToDeactiveAll(_except);
    }



    globalctlDistancia.events.register("activate", this, _activateAControl);
    globalctlDesenho.events.register("activate", this, _activateAControl);
    globalctlImportar.events.register("activate", this, _activateAControl);

    //Criando barra de ferramentas setando o controle que estará ativo no carregamento do mapa
    var toolbar = new OpenLayers.Control.Panel({ defaultControl: ctlDrg });
    globalToolbar = toolbar;

    //Adicionando os controles a barra de ferramentas
    toolbar.addControls(panelControls);

    //Adicionando a barra de ferramentas ao mapa
    map.addControl(toolbar);

    //Adicionando controle de navegação pelo histórico
    map.addControl(ctlNavega);

    map.addControl(ctlBBoxLidar3D);

    map.addControl(ctlTransform);


    //Exibe combo de seleção da escala
    _exibeDivZoomEscala();

    //Exibe imagem de norte
    _exibeNorte();

    map.events.register("zoomend", map, zoomChanged);

    //Adicionando controle para exibição da posição do mouse no mapa

    globalMousePosition = new OpenLayers.Control.MousePosition({
        element: parent.document.getElementById('PosMouse'),
        div: document.getElementById("divMousePosition"),
        numDigits: 0
        //,emptyString: ''
    })

    map.addControl(globalMousePosition);

    //grava o formatoutput default em global
    globalFormatOutput = globalMousePosition.formatOutput;


    // inside the map, docked right middle
    var bookmarks = new OpenLayers.Control.Bookmark({
        'title': ' ',
        'div': OpenLayers.Util.getElement('divBookmarkSelecao'),
        'allowRemove': true
    });


    //Adiciona controle de Bookmark
    map.addControl(bookmarks);
    //para testar     bookmarks.add("ATLANTA", new OpenLayers.Bounds(-85.085373, 33.114328, -83.679123, 34.520578));
    globalBookmark = bookmarks;



    //busca bookmarks armazenados em cookie (exceto IE < 10)
    if (!jQuery.browser.msie || (jQuery.browser.msie && parseInt(jQuery.browser.version.split('.')[0], 10) >= 10)) {
        if (globalBookmark.check() != "") {
            globalBookmark.load();
        }
    }

    //Inibe controles de maximizar e minimizar
    globalBookmark.maximizeDiv.style.display = "none";
    globalBookmark.minimizeDiv.style.display = "none";



    //Adicionando controle para exibição da linha de escala
    //map.addControl(new OpenLayers.Control.ScaleLine());
    globalScaleLine = new OpenLayers.Control.ScaleLine({ div: document.getElementById("divEscalaLine") })

    map.addControl(globalScaleLine);

    //Exibindo o mapa na extensão dos limites definido em "bounds"
    //map.zoomToExtent(boundsCidade);
    //map.zoomToScale(553640, true);

    //ativa o zoomWheel
    ctlNav.activate()


    zoomToResolution();


    //Setar controles para serem habilitados automaticamente quando acionados
    var painel = map.controls[0];
    for (var i = 0; i < painel.lenght; i++) {
        painel.controls[i].autoActivate = true;
    }

    //-------------
    ajustaVisibilidadeCamadas();

    ///   var cGetfeaturePDF = map.controls[6];
    ///   var cGetfeatureInfo = globalctlBtnExibeInfo; // map.controls[10];

    //  globalctlBtnQuadraFiscal.deactivate();
    ///    cGetfeatureInfo.deactivate();

    //salva o handler original do GetfeaturePDFSetor
    ///if (globalctlBtnPDFSetor.events.object.handlers != null) {
    ///     handleGetFeatureSetor = globalctlBtnPDFSetor.events.object.handlers;
    ///}

    //desabilita o handler
    /// globalctlBtnPDFSetor.events.object.handlers = null;

    //muda as funcoes default do listener do PDF para as novas
    globalctlBtnPDFSetor.events.listeners['activate'][0].func = fnRegularPDFSetorAct;
    globalctlBtnPDFSetor.events.listeners['deactivate'][0].func = fnRegularPDFSetorDeact;




    //salva o handler original do GetfeaturePDFQuadra
    ///if (globalctlBtnPDFQuadra.events.object.handlers != null) {
    ///    handleGetFeatureQuadra = globalctlBtnPDFQuadra.events.object.handlers;
    ///}

    //desabilita o handler
    ///globalctlBtnPDFQuadra.events.object.handlers = null;

    //muda as funcoes default do listener do PDF para as novas
    globalctlBtnPDFQuadra.events.listeners['activate'][0].func = fnRegularPDFQuadraAct;
    globalctlBtnPDFQuadra.events.listeners['deactivate'][0].func = fnRegularPDFQuadraDeact;


    //muda as funcoes default do listener do getFeature de selecao para as novas
    globalctlGetSelecao.events.listeners['activate'][0].func = fnRegularSelecaoAct;
    globalctlGetSelecao.events.listeners['deactivate'][0].func = fnRegularSelecaoDeact;

    //muda as funcoes default do listener do getFeature de selecao para as novas
    globalctlGetSelecaoDown.events.listeners['activate'][0].func = fnRegularSelecaoDownAct;
    globalctlGetSelecaoDown.events.listeners['deactivate'][0].func = fnRegularSelecaoDownDeact;


    //Varre todos os controles enxertando comando na função default ou na já alterada
    var triggerDefault;
    var controleAtual;
    var strFuncaoAtual;
    var strFuncaoNova;
    var fcFuncaoNova;
    var cl;

    for (var i = 0; i < map.controls.length; i++) {
        controleAtual = map.controls[i]
        cl = controleAtual.displayClass;
        //para os controles que tem trigger
        if (controleAtual.trigger != undefined) {
            //para determinados controles
            if (cl == "olControlZoomIn" || cl == "olControlZoomIn" || cl == "olControlZoomOut" || cl == "olControlZoomToMaxExtent" || cl == "ctlBtnShowLayers" || cl == "ctlBtnImpressao" || cl == "ctlBtnPesquisaLogradouro" || cl == "ctlBtnLimpaSelecao" || cl == "ctlBtnExibeInfo" || cl == "ctlBtnExibeCroqui" || cl == "ctlBtnSelecao" || cl == "ctlBtnConfig" || cl == "ctlBtnContato" || cl == "ctlBtnHelp" || cl == "ctlBtnPDF" || cl == "ctlBtnBookmark" || cl == "ctlBtnDownloadImagem" || cl == "ctlBtnCoordenadas" || cl == "ctlBtnDownloadArquivos" || cl == "ctlGetMapaArticulado" || cl == "ctlBtnGetBBoxLidar" || cl == "ctlDesenho" || cl == "ctlImportar") {
                //pega a funcao default do trigger
                triggerDefault = controleAtual.trigger;

                strFuncaoAtual = triggerDefault.toString();
                strFuncaoNova = strFuncaoAtual.substr(0, strFuncaoAtual.length - 1) //pega toda a funcao até antes do "}"
                strFuncaoNova = strFuncaoNova + "; controlesClick(" + i + ",'I') }";

                if (cl == "olControlZoomToMaxExtent") {
                    //substitui a funcionalidade de zoomToMaxExtent para zoom de acordo com a resolução
                    strFuncaoNova = strFuncaoNova.replace("this.map.zoomToMaxExtent()", "zoomToResolution()");
                }

                //substitui trigger
                controleAtual.trigger = eval("fcFuncaoNova = " + strFuncaoNova);
            }



        } else {
            //para controles que nao tem trigger, adiciona a chamada na funcao de activate default
            if (cl == "olControlZoomBox" || cl == "olControlDragPan" || cl == "olControlDynamicMeasure") {
                //pega a funcao default de activate
                var fcDefault = controleAtual.events.listeners['activate'][0].func;

                strFuncaoAtual = fcDefault.toString();
                strFuncaoNova = strFuncaoAtual.substr(0, strFuncaoAtual.length - 1) //pega toda a funcao até antes do "}"
                strFuncaoNova = strFuncaoNova + "; controlesClick(" + i + ",'I') }";

                //ss22352 - o ZoomBox deve voltar um nível de zoom após a execução padrão para ter certeza que a seleção toda ficará visível
                if (cl == "olControlZoomBox") {
                    var strFuncaoAtualZoomBox = controleAtual.handler.callbacks.done.toString()
                    var strFuncaoNovaZoomBox = strFuncaoAtualZoomBox.substr(0, strFuncaoAtualZoomBox.length - 1) //pega toda a funcao até antes do "}"
                    strFuncaoNovaZoomBox = strFuncaoNovaZoomBox + "; map.zoomOut(); }"; //ss22352

                    //substitui handler
                    controleAtual.handler.callbacks.done = eval("fcFuncaoNova = " + strFuncaoNovaZoomBox);
                }




                //substitui trigger
                controleAtual.events.listeners['activate'][0].func = eval("fcFuncaoNova = " + strFuncaoNova);

            }
        }
    }


    //Muda aparencia do GetFeature de PDF
    //$('.olControlPanel .olControlGetFeatureItemInactive')[0].className = $('.olControlPanel .olControlGetFeatureItemInactive')[0].className.replace(RegExp("Inactive"), "PDFInactiveTransparent")
    //globalctlBtnQuadraFiscal.panel_div.className = "olControlGetFeatureItemPDFInactiveTransparent olButton";

    globalctlBtnPDFSetor.panel_div.className = "olControlGetFeatureItemPDFSetorInactive olButton";
    globalctlBtnPDFQuadra.panel_div.className = "olControlGetFeatureItemPDFQuadraInactive olButton";


    //Muda aparencia do GetFeature de INFO
    //$('.olControlPanel .olControlGetFeatureItemInactive')[0].className = $('.olControlPanel .olControlGetFeatureItemInactive')[0].className.replace(RegExp("Inactive"), "InfoNaoVisivel")
    globalctlBtnExibeInfo.panel_div.className = "ctlBtnExibeInfoItemInactiveTransparent olButton";

    //Muda aparencia do GetFeature de Selecao
    globalctlGetSelecao.panel_div.className = "olControlGetFeatureItemSelecaoInactive olButton";

    //Muda aparencia do GetFeature de Selecao do Mapa Articulado
    globalctlGetMapaArticulado.panel_div.className = "olControlGetFeatureItemSelecaoInactive olButton";

    //******************************TODO ESTARÁ CHUMBADO, MUDAR ********************************
    /*var mm = map.layers[12];

    mm.setVisibility(false);*/
    //******************************FIM TODO ESTARÁ FIXO, MUDAR ********************************


    //chama a função pois toda a exibição ou não das camadas dependem do zoom
    //zoomChangeLayerSwitcher(map.getZoom());

    //arredonda para baixo
    zoomChangeLayerSwitcher(Math.floor(map.getZoom()));    //Necessário para funcionar o fractionalZoom = true
    //zoomChangeLayerSwitcher(Math.round(map.getZoom()));    //Necessário para funcionar o fractionalZoom = true


    /*PageLoad_Javascript*/
    carregaListaSubprefeitura();
    carregaListaDistrito();
    montaPilarAutoComplete();
    montaQuadriculaAutoComplete();
    limitaTituloImpressao();
    limitaAssuntoEmail();

    /*Exibe ajuda logo no carregamento da página 28/04/2014*/
    //Agora é chamada quando o questionário é preenchido e submetido
    //_showAjuda();

    //adiciona evento para posicionar a(s) camada(s) cosmetica(s) com os resultados de consulta e objetos selecionados sempre no topo
    //necessario apos a otimizacao do carregamento das camadas.
    map.events.register('addlayer', map, function () {
        this.setLayerIndex(map.getLayersByName("Selecionados_Download")[0], this.layers.length);
        if (map.getLayersByName("Lote")[0] != undefined) {
            this.setLayerIndex(map.getLayersByName("Lote")[0], this.layers.length);
        }
    });

    globalctlBtnShowLayers.trigger();

    /*Exibe questionário na abertura da página*/
    //desabilita o questionario para apresentação de mensagem genérica
    exibeQuestionario(false);

    //habilitar ou desabilitar o popup com mensagem na abertura da página
    //exibeMsgGenerica(true);



}







/*
function formatLonlats(lonLat) {
var lat = lonLat.lat;
var long = lonLat.lon;
var ns = OpenLayers.Util.getFormattedLonLat(lat);
var ew = OpenLayers.Util.getFormattedLonLat(long, 'lon');
return ns + ', ' + ew + ' (' + (Math.round(lat * 10000) / 10000) + ', ' + (Math.round(long * 10000) / 10000) + ')';
}
*/














/*********************************************************
Nome: zoomChanged()
Objetivo: Função executada quando a escala de zoom é mudada. Deve ajustar o combo de escala e controlar se as camadas devem ser exibidas de acordo com o arquivo de configuração
Disparador(es): map.events.register("zoomend", map, zoomChanged);
**********************************************************/
zoomChanged = function () {
    //zoom = map.getZoom();
    //var zoom = Math.round(map.getZoom()) //Necessário para funcionar o fractionalZoom = true
    var zoom = Math.floor(map.getZoom()) //Necessário para funcionar o fractionalZoom = true
    //Muda o valor do combo de escala de acordo com o zoom
    //document.getElementById("cboEscala").value = zoom;

    document.getElementById('txtEscala').value = Math.round(map.getScale()); //parseInt(map.getScale());

    //Controla se nesse nivel de zoom devera exibir o botão de informação e se sim, quais camadas devem aparecer no combo (somente camadas que estão visiveis e que possuem informaçoes)
    controlaNiveisInformacao(zoom);

    //Controla se nesse nivel de zoom devera exibir o botão de PDF de quadra viária ou setor e se sim, quais camadas devem aparecer no combo (somente camadas que estão visiveis entre setor e quadra viária)
    controlaNiveisPDF(zoom);

    //Controla se nesse nivel de zoom devera exibir o botão de seleção e se sim, quais camadas devem aparecer no combo (somente camadas que estão visiveis e que possuem camada de seleção)
    controlaNiveisSelecao(zoom);

    //Deve fazer isso somente para o botão que chama o getFeature
    //var cGetfeaturePDF = globalctlBtnQuadraFiscal //map.controls[6];
    var cPan = globalctlDrg //map.controls[1];

    /*    
    if (zoom < 3) {
    if (cGetfeaturePDF.active == true) {
    cPan.activate();  //ativa o pan (default)
    }

    cGetfeaturePDF.deactivate(); //desativa o getFeat PDF
    cGetfeaturePDF.events.listeners['activate'][0].func = fnInactivePDF;

    //Devido ao problema de iniciar em um zoom maior do que zero em tela grande, caso o handler esteja ainda com valor, joga na variável handleGetFeature
    if (cGetfeaturePDF.events.object.handlers != null) {
    handleGetFeature = cGetfeaturePDF.events.object.handlers;
    }

    cGetfeaturePDF.events.object.handlers = null;
    //Muda aparencia do GetFeature de PDF
    cGetfeaturePDF.panel_div.className = "olControlGetFeatureItemPDFInactiveTransparent olButton";

    resetaQuadra();
    }
    else {
    cGetfeaturePDF.events.listeners['activate'][0].func = fnRegularPDFAct;
    cGetfeaturePDF.events.listeners['deactivate'][0].func = fnRegularPDFDeact;
    cGetfeaturePDF.events.object.handlers = handleGetFeature;

    //Muda aparencia do GetFeature de PDF
    if (cGetfeaturePDF.panel_div.className == "olControlGetFeatureItemPDFActive olButton") {
    cGetfeaturePDF.panel_div.className = "olControlGetFeatureItemPDFActive olButton";
    } else {
    cGetfeaturePDF.panel_div.className = "olControlGetFeatureItemPDFInactive olButton";
    }
    }
    */


    //Chama o ZoomChangeLayerSwitcher que controla as camadas de acordo com o zoom
    //12/11/2014 zoomChangeLayerSwitcherB(zoom);
    zoomChangeLayerSwitcher(zoom);

}


/*********************************************************
Nome: zoomToResolution()
Objetivo: exibe o zoom padrão do mapa de acordo com a resolução da tela
Disparador(es): No botão de ZoomToExtent
**********************************************************/

zoomToResolution = function () {
    map.zoomToExtent(boundsCidade);
    //map.zoomToExtent(bounds);
}


/*********************************************************
Nome: init()
Objetivo: Inicializa a configuração e exibição do mapa na tela (div) 
Disparador(es): Chamada no final da página "downloadOL.aspx"
**********************************************************/
init = function () {
    //Não permite a gravação de cache do arquivo Json
    $(document).ready(function () {
        $.ajaxSetup({ cache: false });
    });

    // para evitar tela rosa
    //o valor default de tentativas e 0 
    //o estilo para modificar a imagem de erro (tela rosa) está em theme\default\style.css style.css
    OpenLayers.IMAGE_RELOAD_ATTEMPTS = 3;


    //inicio alteracoes na usabilidade da interface de pesquisa de Setor-Quadra    

    $('#txtSetorLote').keypress(function (e) {
        if (e.which == 13) {
            e.preventDefault();
            pesquisaLoteInscricao();
        }
    });

    $('#txtQuadraLote').keypress(function (e) {
        if (e.which == 13) {
            e.preventDefault();
            pesquisaLoteInscricao();
        }
    });

    $('#cboTipoQuadraLote').keypress(function (e) {
        if (e.which == 13) {
            e.preventDefault();
            pesquisaLoteInscricao();
        }
    });

    //fim alteracoes na usabilidade da interface de pesquisa de Setor-Quadra-Lote


    carregaLayerSwicherB();

    //painelMensagemLotesCidadao();

}

_vCoordenadaClick = new OpenLayers.Layer.Vector("CoordenadaClick", {
    styleMap: new OpenLayers.Style(OpenLayers.Feature.Vector.style["select"])
});

irParaCoordenadas = function () {

    var zoom = 10;
    var projectionA = new OpenLayers.Projection("EPSG:4618");  //lat lon  numeros pequenos 23 a 76
    //var projectionB = new OpenLayers.Projection("EPSG:29193"); //sad 169 padrao x,y  acima de 1000
    var projectionB = new OpenLayers.Projection("EPSG:31983");


    if (document.getElementById('txtXY').value != "" && document.getElementById('txtLatLon').value == "" && document.getElementById('txtLatLonGoogle').value == "") {

        var arrP = document.getElementById('txtXY').value.split(',');

        var pixel = new OpenLayers.Pixel(arrP[0], arrP[1]);
        var ll = new OpenLayers.LonLat(arrP[0], arrP[1]);

        //map.moveTo(pixel, zoom);

        if (_vCoordenadaClick != undefined) {
            _vCoordenadaClick.removeAllFeatures();
        }
        else {
            _vCoordenadaClick = new OpenLayers.Layer.Vector("CoordenadaClick", {
                styleMap: new OpenLayers.Style(OpenLayers.Feature.Vector.style["select"])
            });
        }
        var _p = new OpenLayers.Geometry.Point(arrP[0], arrP[1]);
        _vCoordenadaClick.addFeatures([new OpenLayers.Feature.Vector(_p)]);
        map.addLayer(_vCoordenadaClick);
        map.moveTo(ll, zoom);
    }
    else if (document.getElementById('txtXY').value == "" && document.getElementById('txtLatLon').value == "" && document.getElementById('txtLatLonGoogle').value != "") {

        var arrLL = document.getElementById('txtLatLonGoogle').value.split(',');

        var LAT = arrLL[0];
        var LON = arrLL[1];
        //var point = new OpenLayers.LonLat(LON,LAT).transform(projectionM, projectionB);
        var point = new OpenLayers.LonLat(LON, LAT);
        var projGoogle = new OpenLayers.Projection("EPSG:4326");
        var point2 = new OpenLayers.LonLat(LON, LAT).transform(projGoogle, map.getProjectionObject());

        if (_vCoordenadaClick != undefined) {
            _vCoordenadaClick.removeAllFeatures();
        }
        else {
            _vCoordenadaClick = new OpenLayers.Layer.Vector("CoordenadaClick", {
                styleMap: new OpenLayers.Style(OpenLayers.Feature.Vector.style["select"])
            });
        }
        //var _p = new OpenLayers.Geometry.Point(point2.x, point2.y);
        var _p = new OpenLayers.Geometry.Point(point2.lon, point2.lat);
        _vCoordenadaClick.addFeatures([new OpenLayers.Feature.Vector(_p)]);
        map.addLayer(_vCoordenadaClick);

        map.moveTo(point2, zoom);
    }
    else if (document.getElementById('txtXY').value == "" && document.getElementById('txtLatLon').value != "" && document.getElementById('txtLatLonGoogle').value == "") {
        var arrLL = document.getElementById('txtLatLon').value.split(', ');

        var c1 = arrLL[0];
        var coord1 = c1.split(/[^\d\w\.]+/);
        var lat = parseFloat(coord1[0]) + coord1[1] / 60.0 + coord1[2] / 3600.0;
        if (/S|W/i.test(c1)) lat *= -1;
        var c2 = arrLL[1];
        var coord2 = c2.split(/[^\d\w\.]+/);
        var lon = parseFloat(coord2[0]) + coord2[1] / 60.0 + coord2[2] / 3600.0;
        if (/S|W/i.test(c2)) lon *= -1;

        var projGoogle = new OpenLayers.Projection("EPSG:4326");
        var point2 = new OpenLayers.LonLat(lon, lat).transform(projGoogle, map.getProjectionObject());

        if (_vCoordenadaClick != undefined) {
            _vCoordenadaClick.removeAllFeatures();
        }
        else {
            _vCoordenadaClick = new OpenLayers.Layer.Vector("CoordenadaClick", {
                styleMap: new OpenLayers.Style(OpenLayers.Feature.Vector.style["select"])
            });
        }
        var _p = new OpenLayers.Geometry.Point(point2.lon, point2.lat);
        _vCoordenadaClick.addFeatures([new OpenLayers.Feature.Vector(_p)]);
        map.addLayer(_vCoordenadaClick);
        map.moveTo(point2, zoom);
    }

}


downloadMetadados = function () {

    loading();
    var strHTMLifr = "<iframe id=_ifrDown name=_ifrDown width=0 height=0 border=0></iframe>";
    jQuery('#divArquivos').html(strHTMLifr);
    var strURL = "downloadIfr.aspx?orig=DownloadMetadados&arq=metadados_mapa.xls&arqTipo=METADADOS";
    $('#_ifrDown').attr('src', strURL);
    closeloading();

}


downloadMarcoGeodesico = function (tipoNomeMarco, nomeArquivo) {

    loading();
    var strHTMLifr = "<iframe id=_ifrDown name=_ifrDown width=0 height=0 border=0></iframe>";
    jQuery('#divArquivos').html(strHTMLifr);
    if (tipoNomeMarco == "Marco") {
        var strURL = "downloadIfr.aspx?orig=DownloadMarcoGeodesico&arq=pdf\\" + nomeArquivo + ".pdf&arqTipo=MARCO_GEODESICO";
    }
    else {
        var strURL = "downloadIfr.aspx?orig=DownloadMarcoGeodesico&arq=ZIP\\" + nomeArquivo + ".zip&arqTipo=MARCO_GEODESICO";
    }
    $('#_ifrDown').attr('src', strURL);
    closeloading();

}




/*********************************************************
Nome: acionaViewer3DLidar()
Objetivo: Aciona o viewer 3D do Lidar
Disparador(es): 
**********************************************************/

acionaViewer3DLidar = function () {
    alert('teste');

}


/*********************************************************
Nome: endDrag(bbox)
Objetivo: 
Disparador(es): 
**********************************************************/

function endDrag(bbox) {
    var bounds = bbox.getBounds();
    setBounds(bounds);
    drawBox(bounds);
    globalctlBBoxLidar3D.deactivate();
    globalctlBtnGetBBoxLidar.deactivate();
    //globalctlBtnGetBBoxLidar.panel_div.className = globalctlBtnGetBBoxLidar.displayClass + "ItemInactive olButton";
    mostrarDivBounds();

}


/*********************************************************
Nome: boxResize(event)
Objetivo: 
Disparador(es): 
**********************************************************/

function boxResize(event) {
    setBounds(event.feature.geometry.bounds);
}


/*********************************************************
Nome: drawBox(bounds)
Objetivo: 
Disparador(es): 
**********************************************************/

function drawBox(bounds) {
    var feature = new OpenLayers.Feature.Vector(bounds.toGeometry());

    _BboxLidar.addFeatures(feature);
    globalctlTransform.setFeature(feature);
}

/*********************************************************
Nome: toPrecision(zoom, value)
Objetivo: 
Disparador(es): 
**********************************************************/

function toPrecision(zoom, value) {
    var decimals = Math.pow(10, Math.floor(zoom / 3));
    return Math.round(value * decimals) / decimals;
}


/*********************************************************
Nome: setBounds(bounds)
Objetivo: 
Disparador(es): 
**********************************************************/

function setBounds(bounds) {
    if (bounds == null) {
        document.getElementById("divResultadoBboxLidar").innerHTML = "";

    } else {
        b = bounds.clone().transform(map.getProjectionObject(), new OpenLayers.Projection("EPSG:31983"));
        minlon = toPrecision(map.getZoom(), b.left);
        minlat = toPrecision(map.getZoom(), b.bottom);
        maxlon = toPrecision(map.getZoom(), b.right);
        maxlat = toPrecision(map.getZoom(), b.top);



        document.getElementById("divResultadoBboxLidar").innerHTML =
                        "<a id='close_panel-button' href='Javascript:void(0);' onclick='Javascript:inativaLidar3D();' style='color:White;float:right;'>[X]</a>" +
                        "</br></br>" +
                        "<a style='color:White;'>Caso necessário altere a área escolhida arrastando os pontos nos limites do retângulo:</br></br>" +
                        "minlon=" + minlon + ", " +
                        "minlat=" + minlat + ", " +
                        "maxlon=" + maxlon + ", " +
                        "maxlat=" + maxlat +
                        "</br></br>" +
                        "Escolha o modelo:</br></br>" +
                        "<input type='radio' id='rbMDS' name='tipoLevantamento' value='MDS' checked>" +
                        "<label for='rbMDS'>MDS</label>" +
                        "<input type='radio' id='rbMDT' name='tipoLevantamento' value='MDT'>" +
                        "<label for='rbMDT'>MDT</label>" +
                        "</a></br></br>" +
                        "<button type=button onclick='visualizaLidar3D(" + minlon + "," + minlat + "," + maxlon + "," + maxlat + ");'>Visualizar</button>" +
                        "&nbsp;&nbsp;<button type=button onclick=inativaLidar3D()>Cancelar</button>";
    }
}



/*********************************************************
Nome: mostrarDivBounds()
Objetivo: 
Disparador(es): 
**********************************************************/

function mostrarDivBounds() {

    $("#divResultadoBboxLidar").show();
    //$("divResultadoBboxLidar").css("display", "block");
}

/*********************************************************
Nome: visualizaLidar3D()
Objetivo: 
Disparador(es): 
**********************************************************/

function visualizaLidar3D(minlon, minlat, maxlon, maxlat) {

    var tipo = $("input[name='tipoLevantamento']:checked").val();

    if (tipo == "MDS") {
        window.open("https://visualizador-laz-web.s3-sa-east-1.amazonaws.com/index.html?xmax=" + maxlon + "&ymax=" + maxlat + "&xmin=" + minlon + "&ymin=" + minlat);
    } else {
        window.open("https://visualizador-laz-web.s3-sa-east-1.amazonaws.com/index.html?mdt=1&xmax=" + maxlon + "&ymax=" + maxlat + "&xmin=" + minlon + "&ymin=" + minlat);
    }
}


/*********************************************************
Nome: downloadLotes()
Objetivo: 
Disparador(es): 
**********************************************************/

function downloadLotes(CamadaSelecionadaDownload, PastaSelecionadaDownload, strNomeArquivo) {


    $("#downloadLotes").dialog({
        open: function (event, ui) {
            //hide close button.
            $(this).parent().children().children('.ui-dialog-titlebar-close').hide();
        },
        resizable: false,
        height: "auto",
        width: 310,
        modal: true,
        buttons: {
            "De acordo": function () {
                window.open("downloadIfr.aspx?orig=DownloadCamadas&arq=" + escape($('#cboCamadas').val() + "\\\\" + CamadaSelecionadaDownload + "\\\\" + PastaSelecionadaDownload + "\\\\" + strNomeArquivo) + "&arqTipo=" + PastaSelecionadaDownload, "_ifrDown");
                $(this).dialog("close");

            }
        }
    });

}

/*********************************************************
Nome: downloadRiscoHidrologico()
Objetivo: 
Disparador(es): 
**********************************************************/

function downloadRiscoHidrologico(CamadaSelecionadaDownload, PastaSelecionadaDownload, strNomeArquivo) {


    $("#downloadRiscoHidrologico").dialog({
        open: function (event, ui) {
            //hide close button.
            $(this).parent().children().children('.ui-dialog-titlebar-close').hide();
        },
        resizable: false,
        height: "auto",
        width: 310,
        modal: true,
        buttons: {
            "De acordo": function () {
                window.open("downloadIfr.aspx?orig=DownloadCamadas&arq=" + escape($('#cboCamadas').val() + "\\\\" + CamadaSelecionadaDownload + "\\\\" + PastaSelecionadaDownload + "\\\\" + strNomeArquivo) + "&arqTipo=" + PastaSelecionadaDownload, "_ifrDown");
                $(this).dialog("close");

            }
        }
    });

}

/*********************************************************
Nome: downloadZoneamentoRevogado()
Objetivo: 
Disparador(es): 
**********************************************************/

function downloadZoneamentoRevogado(CamadaSelecionadaDownload, PastaSelecionadaDownload, strNomeArquivo) {

    $("#downloadZoneamentoRevogado").dialog({
        open: function (event, ui) {
            //hide close button.
            $(this).parent().children().children('.ui-dialog-titlebar-close').hide();
        },
        resizable: false,
        height: "auto",
        width: 310,
        modal: true,
        buttons: {
            "De acordo": function () {
                window.open("downloadIfr.aspx?orig=DownloadCamadas&arq=" + escape($('#cboCamadas').val() + "\\\\" + CamadaSelecionadaDownload + "\\\\" + PastaSelecionadaDownload + "\\\\" + strNomeArquivo) + "&arqTipo=" + PastaSelecionadaDownload, "_ifrDown");
                $(this).dialog("close");

            }
        }
    });

}



function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
    results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}