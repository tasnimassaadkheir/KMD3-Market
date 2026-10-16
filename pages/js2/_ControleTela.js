
/*************************************************************************************************************************************************************
**************************************************** FUNÇÕES ESPECÍFICAS DA TELA *****************************************************************************
**************************************************************************************************************************************************************/


/*********************************************************
Nome: _limpaSelecao()
Objetivo: Limpa Seleções feitas no mapa
Disparador(es): ctlBtnLimpaSelecao
**********************************************************/

_limpaSelecao = function (bool) {
    resetaLogradouro();
    resetaQuadra();
    resetaSelecao();
    resetaInfoPesq();
    resetaSetorPesq();
    resetaSubprefeituraPesq();
    resetaDistritoPesq();
    resetaMarcoPesq();
    resetaApoioTerrestre();
    resetaLotePesq();
    resetaAreaPublicaPesq();
    resetaLoteLogPesq();
    resetaCoordenadas();
    resetaCamadaDownload();
    resetaCamadaMapaArticulacao();
    resetaCamadaObterInformacao();
    resetaCroquiPatrimonialPesq();
    resetaAreaCedidaPesq();
    resetaPlantaDISDUPPesq();
    $('div.olLayerDiv').css('cursor', 'default');
}

/*********************************************************
Nome: resetaCoordenadas()
Objetivo: Remove seleções de coordenadas da memória
Disparador(es): 
**********************************************************/
resetaCoordenadas = function () {

    //Remove layer da coordenada capturada
    if (_vCoordenadaClick != undefined && map.getLayersBy('name', 'CoordenadaClick').length > 0) {
        map.removeLayer(_vCoordenadaClick);
        _vCoordenadaClick = undefined;
    }
}


/*********************************************************
Nome: resetaLogradouro()
Objetivo: Remove seleções de logradouros da memória
Disparador(es): 
**********************************************************/
resetaLogradouro = function () {

    //Remove layer do logradouro pesquisado e selecionado
    if (layerLogradouroSelect != undefined) {
        map.removeLayer(layerLogradouroSelect);
        layerLogradouroSelect = undefined;
    }
}


/*********************************************************
Nome: resetaQuadra()
Objetivo: Remove seleções de quadrículas da memória
Disparador(es): 
**********************************************************/
resetaQuadra = function () {

    //Remove todas as seleções de quadras
    if (vectorQuadrasSelecionadas != undefined && vectorQuadrasSelecionadas.features != []) {
        vectorQuadrasSelecionadas.removeAllFeatures();
    }
}


/*********************************************************
Nome: resetaSelecao()
Objetivo: Remove seleções da camada de seleções
Disparador(es): 
**********************************************************/
resetaSelecao = function () {

    //Remove todas as seleções de quadras
    if (vectorCamadaSelecao != undefined && vectorCamadaSelecao.features != []) {
        vectorCamadaSelecao.removeAllFeatures();
    }
}



/*********************************************************
Nome: resetaSetorPesq()
Objetivo: Remove seleções de setor da memória
Disparador(es): 
**********************************************************/
resetaSetorPesq = function () {

    //Remove todas as seleções de setor
    if (layerSetorSelect != undefined && layerSetorSelect.features != []) {
        layerSetorSelect.removeAllFeatures();
    }
}

/*********************************************************
Nome: resetaSubprefeituraPesq()
Objetivo: Remove seleções de subprefeitura da memória
Disparador(es): 
**********************************************************/
resetaSubprefeituraPesq = function () {

    //Remove todas as seleções de setor
    if (layerSubprefeituraSelect != undefined && layerSubprefeituraSelect.features != []) {
        layerSubprefeituraSelect.removeAllFeatures();
    }
}

/*********************************************************
Nome: resetaDistritoPesq()
Objetivo: Remove seleções de distrito da memória
Disparador(es): 
**********************************************************/
resetaDistritoPesq = function () {

    //Remove todas as seleções de setor
    if (layerDistritoSelect != undefined && layerDistritoSelect.features != []) {
        layerDistritoSelect.removeAllFeatures();
    }
}

/*********************************************************
Nome: resetaMarcoPesq()
Objetivo: Remove seleções de marco da memória
Disparador(es): 
**********************************************************/
resetaMarcoPesq = function () {

    //Remove todas as seleções de setor
    if (layerMarcoSelect != undefined && layerMarcoSelect.features != []) {
        layerMarcoSelect.removeAllFeatures();
    }
}

/*********************************************************
Nome: resetaLotePesq()
Objetivo: Remove seleções de marco da memória
Disparador(es): 
**********************************************************/
resetaLotePesq = function () {

    //Remove todas as seleções de setor
    if (layerLoteSelect != undefined && layerLoteSelect.features != []) {
        layerLoteSelect.removeAllFeatures();
    }
}


/*********************************************************
Nome: resetaCamadaDownload()
Objetivo: Remove seleções de marco da memória
Disparador(es): 
**********************************************************/
resetaCamadaDownload = function () {

    //Remove todas as seleções de setor
    if (vectorCamadaSelecaoDown != undefined && vectorCamadaSelecaoDown.features != []) {
        vectorCamadaSelecaoDown.removeAllFeatures();
    }
}




/*********************************************************
Nome: resetaCamadaObterInformacao()
Objetivo: Remove seleções do recurso de Obter Informação
Disparador(es): 
**********************************************************/
resetaCamadaObterInformacao = function () {

    //Remove todas as camadas de seleções
    for (x = 0; x < layersVectorInfoTemp.length; x++) {
        var arrLayerInfo = map.getLayersByName(layersVectorInfoTemp[x]);
        if (arrLayerInfo.length > 0) {
            map.removeLayer(arrLayerInfo[0]);
        }
    }
    layersVectorInfoTemp = Array();
    globalListaInfoGrid = Array();
}


/*********************************************************
Nome: resetaCamadaMapaArticulacao()
Objetivo: Remove seleções da memória
Disparador(es): 
**********************************************************/
resetaCamadaMapaArticulacao = function () {

    //Remove todas as seleções
    if (layerQuadriculaSelect != undefined && layerQuadriculaSelect.features != []) {
        layerQuadriculaSelect.removeAllFeatures();
    }
    /*
    if (_vMapaArticuladoQuadricula != undefined && _vMapaArticuladoQuadricula.features != []) {
    _vMapaArticuladoQuadricula.removeAllFeatures();
    }
    */
    if (LayerSelecaoMapaArticulado != undefined && LayerSelecaoMapaArticulado.features != []) {
        LayerSelecaoMapaArticulado.removeAllFeatures();
    }

    if (vectorCamadaMapaArticulado != undefined && vectorCamadaMapaArticulado.features != []) {
        vectorCamadaMapaArticulado.removeAllFeatures();
    }


}

/*********************************************************
Nome: resetaApoioTerrestre()
Objetivo: Remove seleções da memória
Disparador(es): 
**********************************************************/
resetaApoioTerrestre = function () {

    //Remove todas as seleções
    if (layerApoioSelect != undefined && layerApoioSelect.features != []) {
        layerApoioSelect.removeAllFeatures();
    }

}


/*********************************************************
Nome: resetaAreaPublicaPesq()
Objetivo: Remove seleções de área pública da memória
Disparador(es): 
**********************************************************/
resetaAreaPublicaPesq = function () {

    //Remove todas as seleções de setor
    if (layerAreaPublicaSelect != undefined && layerAreaPublicaSelect.features != []) {
        layerAreaPublicaSelect.removeAllFeatures();
    }
    if (LayerSelecaoAreaPublica != undefined && LayerSelecaoAreaPublica.features != []) {
        LayerSelecaoAreaPublica.removeAllFeatures();
    }
    if (LayerSelecaoLoteamento != undefined && LayerSelecaoLoteamento.features != []) {
        LayerSelecaoLoteamento.removeAllFeatures();
    }

    var arrLayerDel = map.getLayersByName("Area_Publica");
    if (arrLayerDel.length > 0) {
        map.removeLayer(arrLayerDel[0]);
    }
}



/*********************************************************
Nome: resetaCroquiPatrimonialPesq()
Objetivo: Remove seleções de área pública da memória
Disparador(es): 
**********************************************************/
resetaCroquiPatrimonialPesq = function () {

    //Remove todas as seleções de croqui patrimonial
    if (croquiPatrimonialSelect != undefined && croquiPatrimonialSelect.features != []) {
        croquiPatrimonialSelect.removeAllFeatures();
    }

}

/*********************************************************
Nome: resetaAreaCedidaPesq()
Objetivo: Remove seleções de área cedida da memória
Disparador(es): 
**********************************************************/
resetaAreaCedidaPesq = function () {

    //Remove todas as seleções de croqui patrimonial
    if (areaCedidaSelect != undefined && areaCedidaSelect.features != []) {
        areaCedidaSelect.removeAllFeatures();
    }

}


/*********************************************************
Nome: resetaPlantaDISDUPPesq()
Objetivo: Remove seleções de planta DIS DUP
Disparador(es): 
**********************************************************/
resetaPlantaDISDUPPesq = function () {

    //Remove todas as seleções de planta DIS DUP
    if (plantaDISDUPSelect != undefined && plantaDISDUPSelect.features != []) {
        plantaDISDUPSelect.removeAllFeatures();
    }

}



/*********************************************************
Nome: resetaLoteLogPesq()
Objetivo: Remove seleções de marco da memória
Disparador(es): 
**********************************************************/
resetaLoteLogPesq = function () {

    //Remove todas as seleções de setor
    if (layerLoteLogradouroSelect != undefined && layerLoteLogradouroSelect.features != []) {
        layerLoteLogradouroSelect.removeAllFeatures();
    }

    var arrLayerDel = map.getLayersByName("Lote_Logradouro");
    if (arrLayerDel.length > 0) {
        map.removeLayer(arrLayerDel[0]);
    }
}

/******************************************************
FUNCOES DE CHAMADA DE DIVS DA PAGINA
******************************************************/

function showDiv() {
    if (document.getElementById('drag').style.display = "none") {
        document.getElementById("drag").style.display = "block";
    }
}

function showLayers() {
    if (document.getElementById('Layers').style.display == "none") {
        document.getElementById("Layers").style.display = "block";
        //document.getElementById("LayersWhiteMapabase").style.display = "block";
        document.getElementById("LayersWhiteCamadas").style.display = "block";
        document.getElementById("LayersWhitePlus").style.display = "block";
        //document.getElementById("LayersWhite").style.display = "block";
        document.getElementById("LayersContorno").style.display = "block";
    } else {
        document.getElementById("Layers").style.display = "none";
        //document.getElementById("LayersWhiteMapabase").style.display = "none";
        document.getElementById("LayersWhiteCamadas").style.display = "none";
        document.getElementById("LayersWhitePlus").style.display = "none";
        //document.getElementById("LayersWhite").style.display = "none";
        document.getElementById("LayersContorno").style.display = "none";
    }
}

function showSelecao() {
    //Deixa combo na opcao default
    document.getElementById("cboCamadaSelecao").value = "";
    if (document.getElementById('selecao').style.display = "none") {
        document.getElementById("selecao").style.display = "block";
    }
}

getCamadasFilho = function (cbo) {
    var pai = cbo.value;
    var htmlFiltro = ''; //jQuery('#cboCamadaFilhoH').find('option[tipo=' + pai + ']');
    var arrHtmlFiltro = jQuery('#cboCamadaFilhoH').find('option[tipo=' + pai + ']').toArray();
    //console.log(htmlFiltro);

    for (var i = 0; i < arrHtmlFiltro.length; i++) {
        htmlFiltro += '<option value="' + arrHtmlFiltro[i].value + '">' + arrHtmlFiltro[i].text + '</option>';
    }
    //console.log(htmlFiltro);

    jQuery('#cboCamadaFilho').html(htmlFiltro);
    $("#cboCamadaFilho").html($('#cboCamadaFilho option').sort(function (x, y) {
        return $(x).text().replace('Á', 'A') < $(y).text().replace('Á', 'A') ? -1 : 1;
    }));
    var atual = jQuery('#cboCamadaFilho').html();
    jQuery('#cboCamadaFilho').html("<option value=''>Selecione a camada</option>" + atual);

}

getCamadasSelecaoFilho = function (cbo) {
    var pai = cbo.value;
    var htmlFiltro = ''; //jQuery('#cboCamadaSelecaoFilhoH').find('option[tipo=' + pai + ']');
    var arrHtmlFiltro = jQuery('#cboCamadaSelecaoFilhoH').find('option[tipo=' + pai + ']').toArray();
    //console.log(htmlFiltro);

    for (var i = 0; i < arrHtmlFiltro.length; i++) {
        htmlFiltro += '<option value="' + arrHtmlFiltro[i].value + '">' + arrHtmlFiltro[i].text + '</option>';
    }
    //console.log(htmlFiltro);

    jQuery('#cboCamadaSelecaoFilho').html(htmlFiltro);
    $("#cboCamadaSelecaoFilho").html($('#cboCamadaSelecaoFilho option').sort(function (x, y) {
        return $(x).text().replace('Á', 'A') < $(y).text().replace('Á', 'A') ? -1 : 1;
    }));
    var atual = jQuery('#cboCamadaSelecaoFilho').html();
    jQuery('#cboCamadaSelecaoFilho').html("<option value=''>Selecione a camada</option>" + atual);

}

/*function showInfo() {
    
if (document.getElementById('infoDrag').style.display = "none") {

//Deixa combo na opcao default e apaga grid, caso tenha
//document.getElementById("cboCamada").value = "";
document.getElementById("gridPesqInfo").innerHTML = "";

if (document.getElementById("cboCamadaFilho").selectedIndex != 0) {
getLayerInfo(document.getElementById("cboCamadaFilho"));
}

document.getElementById("infoDrag").style.display = "block";
}
}*/


function showInfoFlutuante() {

    if (document.getElementById('InfoFlutuante').style.display = "none") {
        document.getElementById("InfoFlutuante").style.display = "block";
        document.getElementById("InfoFlutuanteContorno").style.display = "block";
    }
}

function showCroqui() {
    if (document.getElementById('VisualCroqui').style.display = "none") {
        document.getElementById("VisualCroqui").style.display = "block";
    }
}

function showPDF() {
    //Deixa combo na opcao default
    document.getElementById("cboCamadaPDF").value = "";
    if (document.getElementById('visuPDF').style.display = "none") {
        document.getElementById("visuPDF").style.display = "block";
    }
}


function showConfig() {
    if (document.getElementById('divConfig').style.display = "none") {
        document.getElementById("divConfig").style.display = "block";
    }
}

function showContato() {
    if (document.getElementById('divContato').style.display = "none") {
        document.getElementById("divContato").style.display = "block";
    }
}


function showDivImpressao() {
    if (document.getElementById('divImpressao').style.display = "none") {
        document.getElementById("divImpressao").style.display = "block";
    }
}

function showDivCoord(bool) {
    document.getElementById('divCoord').style.display = (!bool) ? 'none' : 'block';
}

function showDivDownloadCamadas(bool) {
    document.getElementById('divDownloadCamadas').style.display = (!bool) ? 'none' : 'block';
}

function showDivDownloadArquivos(bool) {
    document.getElementById('divDownloadArquivos').style.display = (!bool) ? 'none' : 'block';
}

/*********************************************************
Nome: controlesClick()
Objetivo: Desativa todos os controles exceto o passado como parâmetro, pisca controle quando for botao nao ativável, 
Parâmetro(s): controle que não deve ser desativado e o tipo do primeiro parametro (índice ou o próprio controle)
Disparador(es): trigger dos botoes
**********************************************************/


controlesClick = function (ctrl, tipo) {

    var controle;

    if (tipo == 'I') {
        //se o tipo passado pelo parametro é o índice, busca o controle através dele e joga na variável
        controle = map.controls[ctrl];
    } else {
        //se o tipo passado pelo parametro é o proprio controle, atribui à variável direto
        controle = ctrl;
    }

    var clCtrl = controle.displayClass;
    var cl;



    if (clCtrl != "ctlBtnShowLayers") {
        //desabilita outros controles
        for (var i = 0; i < map.controls.length - 1; i++) {
            if (map.controls[i] != controle) {
                cl = map.controls[i].displayClass;
                //somente controles específicos

                //esses nao tem activate e deactivate
                if (cl == "olControlZoomIn" ||
                    cl == "olControlZoomOut" ||
                    cl == "olControlZoomToMaxExtent" ||
                    cl == "ctlBtnPesquisaLogradouro" ||
                    cl == "ctlBtnCoordenadas" ||
                    cl == "ctlBtnDownloadArquivos" ||
                    cl == "ctlBtnImpressao" ||
                    cl == "ctlBtnExibeInfo" ||
                    cl == "ctlBtnLimpaSelecao" ||
                    cl == "ctlBtnExibeCroqui" ||
                    cl == "ctlBtnConfig" ||
                    cl == "ctlBtnContato" ||
                    cl == "ctlBtnHelp" ||
                    cl == "ctlBtnPDF" ||
                    cl == "olControlGetFeature" ||
                    cl == "ctlBtnSelecao" ||
                    cl == "ctlGetMapaArticulado" ||
                    cl == "ctlBtnGetBBoxLidar" ||
                    cl == "ctlDesenho" ||
                    cl == "ctlImportar" ||
                    cl == "ctlBtnBookmark") {
                    if (cl == "ctlBtnPesquisaLogradouro") {
                        if (globalctlBtnPesquisaLogradouro.panel_div.className == "ctlBtnPesquisaLogradouroItemActive olButton") {
                            globalctlBtnPesquisaLogradouro.panel_div.className = "ctlBtnPesquisaLogradouroItemInactive olButton";
                            document.getElementById('drag').style.display = "none";
                        }
                    }
                    if (cl == "ctlBtnExibeInfo") {
                        if (globalctlBtnImpressao.panel_div.className == "ctlBtnImpressaoItemInactive olButton"){
                            if ((globalctlBtnExibeInfo.panel_div.className == "ctlBtnExibeInfoItemActive olButton")) {
                                inativaPesqInfo();
                            }
                        }
                    }
                    if (cl == "ctlBtnExibeCroqui") {
                        if (globalctlBtnExibeCroqui.panel_div.className == "ctlBtnExibeCroquiItemActive olButton") {
                            inativaExibeCroqui();
                        }
                    }
                    /*
                    if (cl == "ctlBtnPDF" || cl == "olControlGetFeature") {
                    if (globalctlBtnPDF.panel_div.className == "ctlBtnPDFItemActive olButton") {
                    inativaExibePDF();
                    }
                    }
                    
                    if (cl == "ctlBtnSelecao") {
                    if (globalctlBtnSelecao.panel_div.className == "ctlBtnSelecaoItemActive olButton") {
                    inativaSelecao();
                    }
                    }*/

                    if (cl == "ctlDesenho") {
                        if (globalctlDesenho.panel_div.className == "ctlDesenhoItemActive olButton") {
                            inativaBotaoDesenho();
                        }
                    }

                    if (cl == "ctlImportar") {
                        if (globalctlImportar.panel_div.className == "ctlImportarItemActive olButton") {
                            inativaBotaoImportar();
                        }
                    }

                    if (cl == "ctlBtnConfig") {
                        if (globalctlBtnConfig.panel_div.className == "ctlBtnConfigItemActive olButton") {
                            inativaConfig();
                        }
                    }

                    if (cl == "ctlBtnContato") {
                        if (globalctlBtnContato.panel_div.className == "ctlBtnContatoItemActive olButton") {
                            inativaContato();
                        }
                    }

                    if (cl == "ctlBtnImpressao") {
                        if (globalctlBtnImpressao.panel_div.className == "ctlBtnImpressaoItemActive olButton") {
                            inativaExibeDivImpressao();
                        }
                    }

                    if (cl == "ctlBtnBookmark") {
                        if (globalctlBtnBookmark.panel_div.className == "ctlBtnBookmarkItemActive olButton") {
                            inativaBookmark();
                        }
                    }

                    if (cl == "ctlBtnGetBBoxLidar") {
                        if (globalctlBtnGetBBoxLidar.panel_div.className == "ctlBtnGetBBoxLidarItemActive olButton") {
                            inativaLidar3D();
                        }
                    }

                    if (cl == "ctlBtnCoordenadas") {
                        if (globalctlBtnCoordenadas.panel_div.className == "ctlBtnCoordenadasItemActive olButton") {
                            inativaExibeDivCoordenadas();
                        }
                    }
                    if (cl == "ctlBtnDownloadArquivos") {
                        if (globalctlBtnDownloadArquivos.panel_div.className == "ctlBtnDownloadArquivosItemActive olButton") {
                            inativaExibeDivDownloadCamadas();
                        }
                    }



                }

                //esses tem activate e deactivate
                if (cl == "olControlGetFeature" || cl == "olControlZoomBox" || cl == "olControlDragPan" || cl == "olControlDynamicMeasure" || cl == "olControlGetBBoxLidar") {
                    if (map.controls[i].active == true) {
                        map.controls[i].deactivate();
                    }

                    if (cl == "olControlGetFeature") {
                        //se controle 10 ativo e clicou no controle 6
                        if (globalctlBtnExibeInfo.panel_div.className == "olControlGetFeatureItemInfoActive olButton" & controle != globalctlBtnExibeInfo) {
                            globalctlBtnExibeInfo.panel_div.className = "olControlGetFeatureItemInfoInactive olButton";
                        }
                        //quando a troca é por outro getFeature, o css acima já foi mudado anteriormente, tem que tirar f
                        if (controle != globalctlBtnExibeInfo & document.getElementById('infoDrag').style.display == "block") {
                            document.getElementById('infoDrag').style.display = "none";
                        }

                    }
                }

                //esse sempre fica ativo
                if (cl == "olControlNavigation") {
                    //alguns controles não permitem que o zoom por scroll fiquem ativos ao mesmo tempo
                    if (clCtrl != "olControlGetFeature" &
                    clCtrl != "olControlZoomBox" &
                        clCtrl != "ctlBtnGetBBoxLidar" &
                        clCtrl != "olControlDynamicMeasure") {
                        map.controls[i].activate()
                        //globalToolbar.defaultControl = map.controls[i];
                        //globalToolbar.redraw();
                    }
                }


            }
        }
    }


    //pisca botao (alguns em específico)

    if (clCtrl == "olControlZoomIn" ||
        clCtrl == "olControlZoomOut" ||
        clCtrl == "olControlZoomToMaxExtent" ||
        clCtrl == "ctlBtnLimpaSelecao" ||
        clCtrl == "ctlBtnHelp" ||
        clCtrl == "ctlBtnDownloadImagem") {
        controle.panel_div.className = controle.displayClass + "ItemActive olButton";
        setTimeout(function () { controle.panel_div.className = controle.displayClass + "ItemInactive olButton" }, 150);
    }


    //Pesquisa Logradouro
    if (clCtrl == "ctlBtnPesquisaLogradouro") {
        //precisa mudar para inativo quando fecha a janela ou o layerSwitcher
        if (controle.panel_div.className == controle.displayClass + "ItemInactive olButton") {
            controle.panel_div.className = controle.displayClass + "ItemActive olButton";
        }
    }


    //Exibe Croqui
    if (clCtrl == "ctlBtnExibeCroqui") {
        //precisa mudar para inativo quando fecha a janela ou o layerSwitcher
        if (controle.panel_div.className == controle.displayClass + "ItemInactive olButton") {
            controle.panel_div.className = controle.displayClass + "ItemActive olButton";
        }
    }


    //Exibe PDF
    if (clCtrl == "ctlBtnPDF") {
        //precisa mudar para inativo quando fecha a janela ou o layerSwitcher
        if (controle.panel_div.className == controle.displayClass + "ItemInactive olButton") {
            controle.panel_div.className = controle.displayClass + "ItemActive olButton";
        }
    }

    //Exibe Seleção
    if (clCtrl == "ctlBtnSelecao") {
        //precisa mudar para inativo quando fecha a janela ou o layerSwitcher
        if (controle.panel_div.className == controle.displayClass + "ItemInactive olButton") {
            controle.panel_div.className = controle.displayClass + "ItemActive olButton";
        }
    }

    //ShowLayers ativa e desativa no click
    if (clCtrl == "ctlBtnShowLayers") {
        if (controle.panel_div.className == controle.displayClass + "ItemActive olButton") {
            controle.panel_div.className = controle.displayClass + "ItemInactive olButton";
        } else {
            controle.panel_div.className = controle.displayClass + "ItemActive olButton";
        }
    }

    //ctlBtnExibeInfo ativa e desativa no click (caso nao esteja desabilitado)
    if (clCtrl == "ctlBtnExibeInfo") {
        if (controle.panel_div.className != "ctlBtnExibeInfoItemInactiveTransparent olButton") {
            if (controle.panel_div.className == "ctlBtnExibeInfoItemActive olButton") {
                inativaPesqInfo();
            } else {
                controle.panel_div.className = "ctlBtnExibeInfoItemActive olButton";
            }
        }
    }

    //Exibe Config
    if (clCtrl == "ctlBtnConfig") {
        //precisa mudar para inativo quando fecha a janela ou o layerSwitcher
        if (controle.panel_div.className == controle.displayClass + "ItemInactive olButton") {
            controle.panel_div.className = controle.displayClass + "ItemActive olButton";
        }
    }

    //Exibe Contato
    if (clCtrl == "ctlBtnContato") {
        //precisa mudar para inativo quando fecha a janela ou o layerSwitcher
        if (controle.panel_div.className == controle.displayClass + "ItemInactive olButton") {
            controle.panel_div.className = controle.displayClass + "ItemActive olButton";
        }
    }

    //Exibe Impressão
    if (clCtrl == "ctlBtnImpressao") {
        //precisa mudar para inativo quando fecha a janela ou o layerSwitcher
        if (controle.panel_div.className == controle.displayClass + "ItemInactive olButton") {
            controle.panel_div.className = controle.displayClass + "ItemActive olButton";
        }
    }

    //Exibe Bookmark
    if (clCtrl == "ctlBtnBookmark") {
        //precisa mudar para inativo quando fecha a janela ou o layerSwitcher
        if (controle.panel_div.className == controle.displayClass + "ItemInactive olButton") {
            controle.panel_div.className = controle.displayClass + "ItemActive olButton";
        }
    }

    //Exibe LIDAR3D
    if (clCtrl == "ctlBtnGetBBoxLidar") {
        //precisa mudar para inativo quando fecha a janela ou o layerSwitcher
        if (controle.panel_div.className == controle.displayClass + "ItemInactive olButton") {
            controle.panel_div.className = controle.displayClass + "ItemActive olButton";
        }
    }

    //Exibe Coordenadas
    if (clCtrl == "ctlBtnCoordenadas") {
        //precisa mudar para inativo quando fecha a janela ou o layerSwitcher
        if (controle.panel_div.className == controle.displayClass + "ItemInactive olButton") {
            controle.panel_div.className = controle.displayClass + "ItemActive olButton";
        }
    }

    //Exibe Download Camadas
    if (clCtrl == "ctlBtnDownloadArquivos") {
        //precisa mudar para inativo quando fecha a janela ou o layerSwitcher
        if (controle.panel_div.className == controle.displayClass + "ItemInactive olButton") {
            controle.panel_div.className = controle.displayClass + "ItemActive olButton";
        }
    }

}


/*********************************************************
Nome: removeControle(controle)
Objetivo: remove o controle da toolbox
Parâmetro(s):
Disparador(es):
**********************************************************/
removeControle = function (controleRem) {

    //cria novo array com todos os controles exceto o que deve ser removido, joga no map.controls e dá o redraw
    var arrControls = new Array();
    for (var i = 0; i < map.controls[0].controls.length; i++) {
        var c1 = map.controls[0].controls[i];
        if (controleRem.displayClass != c1.displayClass) {
            arrControls.push(c1);
        }
    }
    map.controls[0].controls = arrControls;
    map.controls[0].redraw()
}




/*********************************************************
Nome: inativaPesqLogr()
Objetivo: Inativa o controle de Pesquisa por Logradouro
Parâmetro(s):
Disparador(es):
**********************************************************/
inativaPesqLogr = function () {
    globalctlBtnPesquisaLogradouro.panel_div.className = globalctlBtnPesquisaLogradouro.displayClass + "ItemInactive olButton";
}





/*********************************************************
Nome: inativaExibeCroqui()
Objetivo: Inativa o controle exibição de croqui
Parâmetro(s):
Disparador(es):
**********************************************************/

inativaExibeCroqui = function () {
    globalctlBtnExibeCroqui.panel_div.className = globalctlBtnExibeCroqui.displayClass + "ItemInactive olButton";
    document.getElementById('VisualCroqui').style.display = "none";
}


/*********************************************************
Nome: inativaExibeDivImpressao()
Objetivo: Inativa o controle exibição de croqui
Parâmetro(s):
Disparador(es):
**********************************************************/

inativaExibeDivImpressao = function () {
    globalctlBtnImpressao.panel_div.className = globalctlBtnImpressao.displayClass + "ItemInactive olButton";
    document.getElementById('divImpressao').style.display = "none";
}


/*********************************************************
Nome: inativaExibeDivCoordenadas()
Objetivo: Inativa o controle exibição da div de coordenadas
Parâmetro(s):
Disparador(es):
**********************************************************/

inativaExibeDivCoordenadas = function () {
    globalctlBtnCoordenadas.panel_div.className = globalctlBtnCoordenadas.displayClass + "ItemInactive olButton";
    document.getElementById('divCoord').style.display = "none";
    resetaCoordenadas();
}


/*********************************************************
Nome: inativaExibeDivDownloadCamadas()
Objetivo: Inativa o controle exibição da div de coordenadas
Parâmetro(s):
Disparador(es):
**********************************************************/

inativaExibeDivDownloadCamadas = function () {
    globalctlBtnDownloadArquivos.panel_div.className = globalctlBtnDownloadArquivos.displayClass + "ItemInactive olButton";
    document.getElementById('divDownloadCamadas').style.display = "none";
}

/*********************************************************
Nome: inativaExibeDivDownloadArquivos()
Objetivo: Inativa o controle exibição da div de coordenadas
Parâmetro(s):
Disparador(es):
**********************************************************/

inativaExibeDivDownloadArquivos = function () {
    globalctlBtnPesquisaLogradouro.panel_div.className = globalctlBtnPesquisaLogradouro.displayClass + "ItemInactive olButton";
    document.getElementById('divDownloadArquivos').style.display = "none";
}


/*********************************************************
Nome: ativaFeaturePDF()
Objetivo: Ativa o controle de visualização de PDF
Parâmetro(s):
Disparador(es):
**********************************************************/
ativaFeaturePDF = function (cbo) {
    if (cbo.value == 'S') {
        globalctlBtnPDFSetor.activate();
    } else {
        globalctlBtnPDFQuadra.activate();
    }

}


/*********************************************************
Nome: inativaExibePDF()
Objetivo: Inativa o controle de visualização de PDF
Parâmetro(s):
Disparador(es):
**********************************************************/
inativaExibePDF = function () {
    if (habilitaPDF == true) {
        globalctlBtnPDF.panel_div.className = globalctlBtnPDF.displayClass + "ItemInactive olButton";
    } else {
        globalctlBtnPDF.panel_div.className = globalctlBtnPDF.displayClass + "ItemInactiveTransparent olButton";
    }
    document.getElementById('visuPDF').style.display = 'none';
}



/*********************************************************
Nome: inativaConfig()
Objetivo: Inativa o controle de visualização de PDF
Parâmetro(s):
Disparador(es):
**********************************************************/
inativaConfig = function () {
    globalctlBtnConfig.panel_div.className = globalctlBtnConfig.displayClass + "ItemInactive olButton";
    document.getElementById('divConfig').style.display = 'none';
}


/*********************************************************
Nome: ativaBookmark()
Objetivo: Ativa o controle visualização de bookmark
Parâmetro(s):
Disparador(es):
**********************************************************/
ativaBookmark = function () {
    globalctlBtnBookmark.panel_div.className = globalctlBtnBookmark.displayClass + "ItemActive olButton";
    document.getElementById('divBookmark').style.display = 'block';
}


/*********************************************************
Nome: ativaLidar3D()
Objetivo: Ativa o controle do LIDAR3D
Parâmetro(s):
Disparador(es):
**********************************************************/
ativaLidar3D = function () {
    globalctlBtnGetBBoxLidar.panel_div.className = globalctlBtnGetBBoxLidar.displayClass + "ItemActive olButton";
    globalctlBBoxLidar3D.activate();
    $('div.olLayerDiv').css('cursor', 'crosshair');
    $("divResultadoBboxLidar").css("display", "block");
    _BboxLidar.destroyFeatures();
    $("#divResultadoBboxLidar").fadeOut('normal');
}

/*********************************************************
Nome: inativaBookmark()
Objetivo: Inativa o controle visualização de bookmark
Parâmetro(s):
Disparador(es):
**********************************************************/
inativaBookmark = function () {
    globalctlBtnBookmark.panel_div.className = globalctlBtnBookmark.displayClass + "ItemInactive olButton";
    document.getElementById('divBookmark').style.display = 'none';
    //grava/atualiza cookie (exceto IE < 10)
    if (!jQuery.browser.msie || (jQuery.browser.msie && parseInt(jQuery.browser.version.split('.')[0], 10) >= 10)) {
        globalBookmark.store();
    }
}


/*********************************************************
Nome: inativaLidar3D()
Objetivo: Inativa o controle do LIDAR3D
Parâmetro(s):
Disparador(es):
**********************************************************/
inativaLidar3D = function () {
    globalctlBtnGetBBoxLidar.panel_div.className = globalctlBtnGetBBoxLidar.displayClass + "ItemInactive olButton";
    globalctlBtnGetBBoxLidar.deactivate();
    $('div.olLayerDiv').css('cursor', 'default');
    $("#divResultadoBboxLidar").fadeOut('normal');
    globalctlTransform.deactivate();
    _BboxLidar.destroyFeatures();
}


/*********************************************************
Nome: adicionaBookmark()
Objetivo: Adiciona bookmark
Parâmetro(s):
Disparador(es):
**********************************************************/
adicionaBookmark = function () {
    if (document.getElementById('txtBookmark').value != "") {
        globalBookmark.add(document.getElementById('txtBookmark').value, map.getExtent().toBBOX());
        //grava/atualiza cookie (exceto IE < 10)
        if (!jQuery.browser.msie || (jQuery.browser.msie && parseInt(jQuery.browser.version.split('.')[0], 10) >= 10)) {
            globalBookmark.store();
        }

    } else {
        jAlert('É necessário um nome para o bookmark', 'Mensagem', function () { });
    }
}






/*********************************************************
Nome: inativaContato()
Objetivo: Inativa o controle contato
Parâmetro(s):
Disparador(es):
**********************************************************/
inativaContato = function () {
    globalctlBtnContato.panel_div.className = globalctlBtnContato.displayClass + "ItemInactive olButton";
    document.getElementById('divContato').style.display = 'none';
}


limitaAssuntoEmail = function () {
    jQuery('#txtMsgContato').limiter(600, jQuery('#ContCharContato'));
}





/*********************************************************
Nome: ativaFeatureSelecao()
Objetivo: Ativa o controle de Seleção
Parâmetro(s):
Disparador(es):
**********************************************************/
ativaFeatureSelecao = function (cbo) {
    //altera a camada de seleção do getFeature dinamicamente
    globalctlGetSelecao.protocol.params.featureType = cbo.value;
    globalctlGetSelecao.protocol.params.typeName = cbo.value;
    globalctlGetSelecao.activate();
    document.getElementById('selecao').style.display = 'none';
}




/*********************************************************
Nome: downloadCroquiAreaPublica()
Objetivo: Realiza o download do croqui da área pública
Parâmetro(s):
Disparador(es):
**********************************************************/
downloadCroquiAreaPublica = function () {


    var nrCroqui = $('#txtAreaAreaPublica').val();

    if (nrCroqui == '') {

        //antes de permitir que o usuário clique para fazer o download, verifica se a camada está ligada no layerSwitcher

        if ($('#area_publica176').is(':checked') && $('#area_publica176').is(':enabled')) {
            _limpaSelecao();
            globalctlGetAreaPublicaLatLon.activate();
            document.getElementById('drag').style.display = "none";
            $('div.olLayerDiv').css('cursor', 'crosshair');
        }
        else {

            jAlert('A camada registro de área pública deve estar ativada e visível para selecionar a geometria!', 'Aviso', function () { });

        }
    }
    else {

        loading();

        var _hc = jQuery('#hc', window.parent.document).val();
        var _cqlfilter = "cd_cadastro_area_publica ='" + nrCroqui.replace(/^0+/, '') + "'";

        //faço requisição WFS somente para validar se o código da area publica informada existe no servico/base de dados
        //o nome do arquivo de download da area publica é sempre o mesmo valor da propriedade cd_cadastro_area_publica no serviço
        var layerAreaPublicaSelect_wfs_options = {
            request: "GetFeature",
            service: "wfs",
            version: "1.0.0",
            typeName: NM_LAYER_AREA_PUBLICA_WFS,
            propertyName: 'cd_cadastro_area_publica',
            outputFormat: 'json',
            cql_filter: _cqlfilter
        };
        jQuery.ajax({
            url: 'map.geo?hc=' + _hc + '&tipoServico=WFS_EXTERNO_GEOPATRI',
            data: layerAreaPublicaSelect_wfs_options,
            dataType: 'json',
            success: function (res) {
                var arrFeaturesJson = res.features;
                if (arrFeaturesJson.length == 0) {
                    jAlert('Não foi possível localizar a área pública a partir do código de registro informado!', 'Aviso', function () {
                        closeloading();
                    });
                }
                else {
                    var strNmPDF = nrCroqui + '.zip';
                    var _nm_arquivo = strNmPDF;
                    var strHTMLifr = "<iframe id=_ifrDown name=_ifrDown width=0 height=0 border=0 src=downloadIfr.aspx?orig=DownloadAreaPublicaGEOPATRI&arq=" + escape(_nm_arquivo) + "&arqTipo=AREA_PUBLICA_GEOPATRI></iframe>";
                    jQuery('#divArquivos').html(strHTMLifr);
                    closeloading();
                }

            }
        });

    }

}



/*********************************************************
Nome: downloadCroquiPatrimonial()
Objetivo: Realiza o download do croqui patrimonial
Parâmetro(s):
Disparador(es):
**********************************************************/
downloadCroquiPatrimonial = function () {


    var nrCroqui = $('#txtCroquiLoteamento').val();

    if (nrCroqui == '') {

        //antes de permitir que o usuário clique para fazer o download, verifica se a camada está ligada no layerSwitcher

        if ($('#croqui_patrimonial160').is(':checked') && $('#croqui_patrimonial160').is(':enabled')) {

            $("#mensagemDownloadCroquiPatrimonial").dialog({
                    open: function (event, ui) {
                        //hide close button.
                        $(this).parent().children().children('.ui-dialog-titlebar-close').hide();
                    },
                    resizable: false,
                    height: "auto",
                    width: 430,
                    modal: true,
                    buttons: {
                        "De acordo": function () {              
                            _limpaSelecao();
                            globalctlGetLoteamentoLatLon.activate();
                            document.getElementById('drag').style.display = "none";
                            $('div.olLayerDiv').css('cursor', 'crosshair');
                            $(this).dialog("close");
                        }
                    }
                });
        }
        else {

            jAlert('A camada croqui patrimonial deve estar ativada e visível para selecionar a geometria!', 'Aviso', function () { });

        }
    }
    else {

        $("#mensagemDownloadCroquiPatrimonial").dialog({
            open: function (event, ui) {
                //hide close button.
                $(this).parent().children().children('.ui-dialog-titlebar-close').hide();
            },
            resizable: false,
            height: "auto",
            width: 430,
            modal: true,
            buttons: {
                "De acordo": function () {              
                    
                    loading();

                    var _hc = jQuery('#hc', window.parent.document).val();
                    var _cqlfilter = "nr_croqui='" + nrCroqui + "'";

                    //faço requisição WFS somente para validar se o código de croqui informado existe no servico/base de dados
                    //o nome do arquivo de download do croqui é sempre o mesmo valor da propriedade nr_croqui no serviço
                    var croqui_patrimonial_wfs_options = {
                        request: "GetFeature",
                        service: "wfs",
                        version: "1.0.0",
                        typeName: NM_LAYER_LOTEAMENTO_CROQUI_AREA_WFS,
                        propertyName: 'nr_croqui',
                        outputFormat: 'json',
                        cql_filter: _cqlfilter
                    };
                    jQuery.ajax({
                        url: 'map.geo?hc=' + _hc + '&tipoServico=WFS_EXTERNO_GEOPATRI',
                        data: croqui_patrimonial_wfs_options,
                        dataType: 'json',
                        success: function (res) {
                            var arrFeaturesJson = res.features;
                            if (arrFeaturesJson.length == 0) {
                                jAlert('Não foi possível localizar o croqui patrimonial a partir do código informado!', 'Aviso', function () {
                                    closeloading();
                                });
                            }
                            else {
                                var strNmPDF = nrCroqui + '.pdf';
                                var _nm_arquivo = strNmPDF;
                                var strHTMLifr = "<iframe id=_ifrDown name=_ifrDown width=0 height=0 border=0 src=downloadIfr.aspx?orig=DownloadCroquiGEOPATRI&arq=" + escape(_nm_arquivo) + "&arqTipo=CROQUI_GEOPATRI></iframe>";
                                jQuery('#divArquivos').html(strHTMLifr);
                                closeloading();
                            }

                        }
                    });


                    $(this).dialog("close");
                }
            }
        });

    }

}



/*********************************************************
Nome: downloadAreaCedida()
Objetivo: Realiza o download da áera cedida
Parâmetro(s):
Disparador(es):
**********************************************************/
downloadAreaCedida = function () {


    var nrCroqui = $('#txtAreaCedida').val();

    if (nrCroqui == '') {

        //antes de permitir que o usuário clique para fazer o download, verifica se a camada está ligada no layerSwitcher

        if ($('#area_cedida175').is(':checked') && $('#area_cedida175').is(':enabled')) {
            _limpaSelecao();
            globalctlGetAreaCedidaLatLon.activate();
            document.getElementById('drag').style.display = "none";
            $('div.olLayerDiv').css('cursor', 'crosshair');
        }
        else {

            jAlert('A camada área cedida deve estar ativada e visível para selecionar a geometria!', 'Aviso', function () { });

        }
    }
    else {

        loading();

        var _hc = jQuery('#hc', window.parent.document).val();
        var _cqlfilter = "cd_auto_cessao='" + nrCroqui + "'";

        //faço requisição WFS somente para validar se o código da area cedida informada existe no servico/base de dados
        //o nome do arquivo de download da area cedida é sempre o mesmo valor da propriedade cd_numero_auto_cessao no serviço
        var area_cedida_wfs_options = {
            request: "GetFeature",
            service: "wfs",
            version: "1.0.0",
            typeName: NM_LAYER_AREA_CEDIDA_WFS,
            propertyName: 'cd_auto_cessao',
            outputFormat: 'json',
            cql_filter: _cqlfilter
        };
        jQuery.ajax({
            url: 'map.geo?hc=' + _hc + '&tipoServico=WFS_EXTERNO_GEOPATRI',
            data: area_cedida_wfs_options,
            dataType: 'json',
            success: function (res) {
                var arrFeaturesJson = res.features;
                if (arrFeaturesJson.length == 0) {
                    jAlert('Não foi possível localizar a área cedida a partir do código informado!', 'Aviso', function () {
                        closeloading();
                    });
                }
                else {
                    var strNmPDF = nrCroqui + '.zip';
                    var _nm_arquivo = strNmPDF;
                    var strHTMLifr = "<iframe id=_ifrDown name=_ifrDown width=0 height=0 border=0 src=downloadIfr.aspx?orig=DownloadAreaCedidaGEOPATRI&arq=" + escape(_nm_arquivo) + "&arqTipo=AREA_CEDIDA_GEOPATRI></iframe>";
                    jQuery('#divArquivos').html(strHTMLifr);
                    closeloading();
                }

            }
        });

    }

}


/*********************************************************
Nome: downloadPlantaDISDUP()
Objetivo: Realiza o download da planta DIS DUP
Parâmetro(s):
Disparador(es):
**********************************************************/
downloadPlantaDISDUP = function () {


    var nrPlantaDISDUP = $('#txtPlantaDISDUP').val();

    if (nrPlantaDISDUP == '') {

        //antes de permitir que o usuário clique para fazer o download, verifica se a camada está ligada no layerSwitcher

        if ($('#planta_dup_dis_pd5465').is(':checked') && $('#planta_dup_dis_pd5465').is(':enabled')) {
            _limpaSelecao();
            globalctlGetPlantaDISDUPLatLon.activate();
            document.getElementById('drag').style.display = "none";
            $('div.olLayerDiv').css('cursor', 'crosshair');
        }
        else {

            jAlert('A camada Plantas de Decreto (DUP / DIS) deve estar ativada e visível para selecionar a geometria!', 'Aviso', function () { });

        }
    }
    else {

        loading();

        var _hc = jQuery('#hc', window.parent.document).val();
        var _cqlfilter = "nm_planta_desap='" + nrPlantaDISDUP + "'";

        //faço requisição WFS somente para validar se o código da planta DIS DUP informada existe no servico/base de dados
        //o nome do arquivo de download da planta DIS DUP é sempre o mesmo valor da propriedade cd_numero_planta + tamanho no serviço
        var planta_DIS_DUP_wfs_options = {
            request: "GetFeature",
            service: "wfs",
            version: "1.0.0",
            typeName: NM_LAYER_PLANTA_DIS_DUP_WFS,
            //propertyName: 'cd_numero_planta',
            outputFormat: 'json',
            cql_filter: _cqlfilter
        };
        jQuery.ajax({
            url: 'map.geo?hc=' + _hc + '&tipoServico=DWFS1',
            data: planta_DIS_DUP_wfs_options,
            dataType: 'json',
            success: function (res) {
                var arrFeaturesJson = res.features;
                if (arrFeaturesJson.length == 0) {
                    jAlert('Não foi possível localizar a Planta DIS DUP a partir do código informado!', 'Aviso', function () {
                        closeloading();
                    });
                }
                else {
                    var strNmPDF = nrPlantaDISDUP + '_' + res.features[0].properties['sg_tipo_formato'].trim() + '.pdf';
                    var _nm_arquivo = strNmPDF;
                    var strHTMLifr = "<iframe id=_ifrDown name=_ifrDown width=0 height=0 border=0 src=downloadIfr.aspx?orig=DownloadPlantaDISDUP&arq=" + escape(_nm_arquivo) + "&arqTipo=DIS_DUP></iframe>";
                    jQuery('#divArquivos').html(strHTMLifr);
                    closeloading();
                }

            }
        });

        painelMensagemDISDUPAtivo();

    }

}



/*********************************************************
Nome: localizaAreaPublica()
Objetivo: Localiza o croqui da área pública
Parâmetro(s):
Disparador(es):
**********************************************************/
localizaAreaPublica = function () {

    //reseta o mapa
    _limpaSelecao();


    loading();

    //localiza no mapa o croqui patrimonial pesquisado
    var nrArea = $('#txtAreaAreaPublica').val();
    var _hc = jQuery('#hc', window.parent.document).val();
    var _cqlfilter = "cd_cadastro_area_publica ='" + nrArea.replace(/^0+/, '') + "'";
    var layerAreaPublicaSelect_wfs_options = {
        url: 'map.geo?hc=' + _hc + '&tipoServico=WFS_EXTERNO_GEOPATRI',
        transparent: true,
        params: {
            request: "GetFeature",
            service: "wfs",
            version: "1.0.0",
            typeName: NM_LAYER_AREA_PUBLICA_WFS,
            featureType: NM_LAYER_AREA_PUBLICA_WFS,
            CQL_FILTER: _cqlfilter,
            outputFormat: "application/json"
        },
        format: new OpenLayers.Format.GeoJSON({
            geometryName: "ge_multipoligono"
        })
    };
    layerAreaPublicaSelect = new OpenLayers.Layer.Vector("Area_Publica", {
        strategies: [new OpenLayers.Strategy.Fixed()],
        protocol: new OpenLayers.Protocol.HTTP(layerAreaPublicaSelect_wfs_options),
        styleMap: new OpenLayers.Style(OpenLayers.Feature.Vector.style["select"])
    });


    //adiciona as camadas criadas acima ao mapa
    map.addLayers([layerAreaPublicaSelect]);

    layerAreaPublicaSelect.events.register("loadend", this, function (e) {
        if (layerAreaPublicaSelect.features.length == 0) {
            jAlert('Não existe área pública com o código informado.!', 'Aviso', function () {
                closeloading();
            });

        }
        else {
            var areaPublicaExtent = layerAreaPublicaSelect.getDataExtent();
            map.zoomToExtent(areaPublicaExtent);
            closeloading();

            //Fechando a popup de pesquisa
            //fechaPopup();
            document.getElementById('drag').style.display = 'none';
            globalctlBtnPesquisaLogradouro.panel_div.className = globalctlBtnPesquisaLogradouro.displayClass + "ItemInactive olButton";

        }

    });



    layerAreaPublicaSelect.events.register("featureclick", this, function (e) {
        var feat = e.feature;
        var strNmPDF = nrArea + '.zip';
        var _nm_arquivo = strNmPDF;
        var strHTMLifr = "<iframe id=_ifrDown name=_ifrDown width=0 height=0 border=0></iframe>";
        var strLinkHTML = "<a class=down target=_ifrDown href=downloadIfr.aspx?orig=DownloadAreaPublicaGEOPATRI&arq=" + escape(_nm_arquivo) + "&arqTipo=AREA_PUBLICA_GEOPATRI>" + _nm_arquivo + "</a>";
        var strHTMLDiv = "<div id='divComboCamadas'>" + strLinkHTML + "</div>";
        jQuery('#divArquivos').html(strHTMLDiv + strHTMLifr);
        jQuery('#divDownloadArquivos').show();
    });

}


/*********************************************************
Nome: localizaCroquiPatrimonial()
Objetivo: Localiza o croqui patrimonial no mapa
Parâmetro(s):
Disparador(es):
**********************************************************/
localizaCroquiPatrimonial = function () {

    //reseta o mapa
    _limpaSelecao();


    loading();

    //localiza no mapa o croqui patrimonial pesquisado
    var nrCroqui = $('#txtCroquiLoteamento').val();
    var _hc = jQuery('#hc', window.parent.document).val();
    var _cqlfilter = "nr_croqui='" + nrCroqui + "'";
    var croqui_patrimonial_wfs_options = {
        url: 'map.geo?hc=' + _hc + '&tipoServico=WFS_EXTERNO_GEOPATRI',
        transparent: true,
        params: {
            request: "GetFeature",
            service: "wfs",
            version: "1.0.0",
            typeName: NM_LAYER_LOTEAMENTO_CROQUI_AREA_WFS,
            featureType: NM_LAYER_LOTEAMENTO_CROQUI_AREA_WFS,
            CQL_FILTER: _cqlfilter,
            outputFormat: "application/json"
        },
        format: new OpenLayers.Format.GeoJSON({
            geometryName: "ge_multipoligono"
        })
    };
    croquiPatrimonialSelect = new OpenLayers.Layer.Vector("Croqui Patrimonial", {
        strategies: [new OpenLayers.Strategy.Fixed()],
        protocol: new OpenLayers.Protocol.HTTP(croqui_patrimonial_wfs_options),
        styleMap: new OpenLayers.Style(OpenLayers.Feature.Vector.style["select"])
    });


    //adiciona as camadas criadas acima ao mapa
    map.addLayers([croquiPatrimonialSelect]);

    croquiPatrimonialSelect.events.register("loadend", this, function (e) {
        if (croquiPatrimonialSelect.features.length == 0) {
            jAlert('Não existe croqui patrimonial com o código informado.!', 'Aviso', function () {
                closeloading();
            });

        }
        else {
            var croquiPatrimonialExtent = croquiPatrimonialSelect.getDataExtent();
            map.zoomToExtent(croquiPatrimonialExtent);
            closeloading();

            //Fechando a popup de pesquisa
            //fechaPopup();
            document.getElementById('drag').style.display = 'none';
            globalctlBtnPesquisaLogradouro.panel_div.className = globalctlBtnPesquisaLogradouro.displayClass + "ItemInactive olButton";

        }

    });



    croquiPatrimonialSelect.events.register("featureclick", this, function (e) {
        var feat = e.feature;
        var strNmPDF = nrCroqui + '.pdf';
        var _nm_arquivo = strNmPDF;
        var strHTMLifr = "<iframe id=_ifrDown name=_ifrDown width=0 height=0 border=0></iframe>";
        var strLinkHTML = "<a class=down target=_ifrDown href=downloadIfr.aspx?orig=DownloadCroquiGEOPATRI&arq=" + escape(_nm_arquivo) + "&arqTipo=CROQUI_GEOPATRI>" + _nm_arquivo + "</a>";
        var strHTMLDiv = "<div id='divComboCamadas'>" + strLinkHTML + "</div>";
        jQuery('#divArquivos').html(strHTMLDiv + strHTMLifr);
        jQuery('#divDownloadArquivos').show();
    });

}


/*********************************************************
Nome: localizaAreaCedida()
Objetivo: Localiza a Area Cedida no mapa
Parâmetro(s):
Disparador(es):
**********************************************************/
localizaAreaCedida = function () {

    //reseta o mapa
    _limpaSelecao();


    loading();

    //localiza no mapa a area cedida pesquisada
    var nrCroqui = $('#txtAreaCedida').val();
    var _hc = jQuery('#hc', window.parent.document).val();
    var _cqlfilter = "cd_auto_cessao='" + nrCroqui + "'";
    var area_cedida_wfs_options = {
        url: 'map.geo?hc=' + _hc + '&tipoServico=WFS_EXTERNO_GEOPATRI',
        transparent: true,
        params: {
            request: "GetFeature",
            service: "wfs",
            version: "1.0.0",
            typeName: NM_LAYER_AREA_CEDIDA_WFS,
            featureType: NM_LAYER_AREA_CEDIDA_WFS,
            CQL_FILTER: _cqlfilter,
            outputFormat: "application/json"
        },
        format: new OpenLayers.Format.GeoJSON({
            geometryName: "ge_multipoligono"
        })
    };
    areaCedidaSelect = new OpenLayers.Layer.Vector("Area Cedida", {
        strategies: [new OpenLayers.Strategy.Fixed()],
        protocol: new OpenLayers.Protocol.HTTP(area_cedida_wfs_options),
        styleMap: new OpenLayers.Style(OpenLayers.Feature.Vector.style["select"])
    });


    //adiciona as camadas criadas acima ao mapa
    map.addLayers([areaCedidaSelect]);

    areaCedidaSelect.events.register("loadend", this, function (e) {
        if (areaCedidaSelect.features.length == 0) {
            jAlert('Não existe área cedida com o código informado.!', 'Aviso', function () {
                closeloading();
            });

        }
        else {
            var areaCedidaExtent = areaCedidaSelect.getDataExtent();
            map.zoomToExtent(areaCedidaExtent);
            closeloading();

            //Fechando a popup de pesquisa
            //fechaPopup();
            document.getElementById('drag').style.display = 'none';
            globalctlBtnPesquisaLogradouro.panel_div.className = globalctlBtnPesquisaLogradouro.displayClass + "ItemInactive olButton";

        }

    });



    areaCedidaSelect.events.register("featureclick", this, function (e) {
        var feat = e.feature;
        var strNmPDF = nrCroqui + '.zip';
        var _nm_arquivo = strNmPDF;
        var strHTMLifr = "<iframe id=_ifrDown name=_ifrDown width=0 height=0 border=0></iframe>";
        var strLinkHTML = "<a class=down target=_ifrDown href=downloadIfr.aspx?orig=DownloadAreaCedidaGEOPATRI&arq=" + escape(_nm_arquivo) + "&arqTipo=AREA_CEDIDA_GEOPATRI>" + _nm_arquivo + "</a>";
        var strHTMLDiv = "<div id='divComboCamadas'>" + strLinkHTML + "</div>";
        jQuery('#divArquivos').html(strHTMLDiv + strHTMLifr);
        jQuery('#divDownloadArquivos').show();
    });

}


/*********************************************************
Nome: localizaPlantaDISDUP()
Objetivo: Localiza a planta DIS DUP no mapa
Parâmetro(s):
Disparador(es):
**********************************************************/
localizaPlantaDISDUP = function () {

    //reseta o mapa
    _limpaSelecao();


    loading();

    //localiza no mapa a planta DIS DUP pesquisada
    var nrPlantaDISDUP = $('#txtPlantaDISDUP').val();
    var _hc = jQuery('#hc', window.parent.document).val();
    var _cqlfilter = "nm_planta_desap='" + nrPlantaDISDUP + "'";
    var planta_DIS_DUP_wfs_options = {
        url: 'map.geo?hc=' + _hc + '&tipoServico=DWFS1',
        transparent: true,
        params: {
            request: "GetFeature",
            service: "wfs",
            version: "1.0.0",
            typeName: NM_LAYER_PLANTA_DIS_DUP_WFS,
            featureType: NM_LAYER_PLANTA_DIS_DUP_WFS,
            CQL_FILTER: _cqlfilter,
            outputFormat: "application/json"
        },
        format: new OpenLayers.Format.GeoJSON({
            geometryName: "ge_poligono"
        })
    };
    plantaDISDUPSelect = new OpenLayers.Layer.Vector("Planta DIS DUP", {
        strategies: [new OpenLayers.Strategy.Fixed()],
        protocol: new OpenLayers.Protocol.HTTP(planta_DIS_DUP_wfs_options),
        styleMap: new OpenLayers.Style(OpenLayers.Feature.Vector.style["select"])
    });


    //adiciona as camadas criadas acima ao mapa
    map.addLayers([plantaDISDUPSelect]);

    plantaDISDUPSelect.events.register("loadend", this, function (e) {
        if (plantaDISDUPSelect.features.length == 0) {
            jAlert('Não existe planta DIS DUP com o código informado.!', 'Aviso', function () {
                closeloading();
            });

        }
        else {
            var plantaDISDUPExtent = plantaDISDUPSelect.getDataExtent();
            map.zoomToExtent(plantaDISDUPExtent);
            closeloading();

            //Fechando a popup de pesquisa
            //fechaPopup();
            document.getElementById('drag').style.display = 'none';
            globalctlBtnPesquisaLogradouro.panel_div.className = globalctlBtnPesquisaLogradouro.displayClass + "ItemInactive olButton";

        }

    });



    plantaDISDUPSelect.events.register("featureclick", this, function (e) {
        var feat = e.feature;
        var strNmPDF = feat.attributes['nm_planta_desap'] + '_' + feat.attributes['sg_tipo_formato'].trim() + '.pdf';
        var _nm_arquivo = strNmPDF;
        var strHTMLifr = "<iframe id=_ifrDown name=_ifrDown width=0 height=0 border=0></iframe>";
        var strLinkDecreto = "<br><br><a class=down target=_blank href=" + feat.attributes['tx_caminho_decreto'] + ">Clique aqui para acessar o decreto</a>";
        var strLinkHTML = "<a class=down target=_ifrDown href=downloadIfr.aspx?orig=DownloadPlantaDISDUP&arq=" + escape(_nm_arquivo) + "&arqTipo=DIS_DUP>" + _nm_arquivo + "</a>";
        var strMensagemHTML = "<br><br><br><label class=fonteMsgRedIntegracao>1. Esta consulta indica os Decretos de Declaração de Utilidade Pública (DUP) dos últimos cinco anos e Decretos de Declaração de Interesse Social (DIS) dos últimos dois anos incidentes sobre a área consultada.<br><br>2. Os perímetros indicados nesta camada têm áreas de abrangência ampliada conforme cobertura da planta a que se referem não sendo precisamente aqueles descritos nos Decretos de Utilidade Pública ou Interesse Social.<br><br>3. Deve-se visualizar a planta e o texto do decreto.<br><br>4. Para saber se efetivamente uma ação de desapropriação teve prosseguimento e foi ajuizada, é necessário consultar o Departamento de Desapropriações - DESAP</label>";
        var strHTMLDiv = "<div id='divComboCamadas'>" + strLinkHTML + strLinkDecreto + strMensagemHTML + "</div>";
        jQuery('#divArquivos').html(strHTMLDiv + strHTMLifr);
        jQuery('#divDownloadArquivos').show();
    });

}


/*********************************************************
Nome: ativaFeatureSelecaoAreaPublica()
Objetivo: Ativa o controle de Seleção
Parâmetro(s):
Disparador(es):
**********************************************************/
ativaFeatureSelecaoAreaPublica = function () {

    var nrSetor = $('#txtSetorAreaPublica').val();
    var nrQuadra = $('#txtQuadraAreaPublica').val();
    var nrArea = $('#txtAreaAreaPublica').val();

    if (nrSetor != '' && nrQuadra != '' && nrArea != '') {

        var _hc = jQuery('#hc', window.parent.document).val();
        var _cqlfilter = "cd_setor_fiscal='" + nrSetor + "'";
        _cqlfilter += " AND cd_quadra='" + nrQuadra + "'";
        _cqlfilter += " AND cd_area_municipal='" + nrArea + "'";
        //Criando opções de para o controle do tipo "OpenLayers.Control.GetFeature"
        var wfs_options = {
            request: "GetFeature",
            service: "wfs",
            version: "1.0.0",
            typeName: NM_LAYER_AREA_PUBLICA_WFS,
            outputFormat: 'json',
            propertyName: 'cd_croqui_area',
            sortBy: 'cd_croqui_area',
            cql_filter: _cqlfilter
        };

        jQuery.ajax({
            url: 'map.geo?hc=' + _hc + '&tipoServico=DWFS1',
            data: wfs_options,
            dataType: 'json',
            success: function (res) {
                //console.log(res);
                var arrFeaturesJson = res.features;
                if (arrFeaturesJson != undefined && arrFeaturesJson != []) {
                    for (var i = 0; i < arrFeaturesJson.length; i++) {
                        var item = arrFeaturesJson[i];
                        console.log(item);
                        var strNmPDF = item.properties['cd_croqui_area'];
                        strNmPDF = strNmPDF.substring(0, 6);
                        var _nm_arquivo = strNmPDF + '.pdf';
                        //console.log(_nm_arquivo);

                        var strHTMLifr = "<iframe id=_ifrDown name=_ifrDown width=0 height=0 border=0 src=downloadIfr.aspx?orig=DownloadAreaPublica&arq=" + escape(_nm_arquivo) + "&arqTipo=AREA_PUBLICA></iframe>";
                        jQuery('#divArquivos').html(strHTMLifr);

                        break;
                    }
                }
            }
        });

    }
    else {
        _limpaSelecao();
        globalctlGetAreaPublicaLatLon.activate();
        document.getElementById('drag').style.display = "none";
        $('div.olLayerDiv').css('cursor', 'crosshair');
    }
}


/*********************************************************
Nome: ativaFeatureSelecaoLoteamento()
Objetivo: Ativa o controle de Seleção
Parâmetro(s):
Disparador(es):
**********************************************************/
ativaFeatureSelecaoLoteamento = function () {

    var nrCroqui = $('#txtCroquiLoteamento').val();

    if (nrCroqui != '') {
        var _hc = jQuery('#hc', window.parent.document).val();
        var _cqlfilter = "cd_croqui='" + nrCroqui + "'";

        //Criando opções de para o controle do tipo "OpenLayers.Control.GetFeature"
        var wfs_options = {
            request: "GetFeature",
            service: "wfs",
            version: "1.0.0",
            typeName: NM_LAYER_LOTEAMENTO_CROQUI_AREA_WFS,
            outputFormat: 'json',
            propertyName: 'tx_endereco',
            sortBy: 'tx_endereco',
            cql_filter: _cqlfilter
        };

        jQuery.ajax({
            url: 'map.geo?hc=' + _hc + '&tipoServico=DWFS1',
            data: wfs_options,
            dataType: 'json',
            success: function (res) {
                //console.log(res);
                var arrFeaturesJson = res.features;
                if (arrFeaturesJson != undefined && arrFeaturesJson != []) {
                    for (var i = 0; i < arrFeaturesJson.length; i++) {
                        var item = arrFeaturesJson[i];
                        console.log(item);
                        var strNmPDF = item.properties['tx_endereco'];
                        strNmPDF = strNmPDF.substring(strNmPDF.lastIndexOf('/') + 1, strNmPDF.length);
                        var _nm_arquivo = strNmPDF;
                        //console.log(_nm_arquivo);

                        var strHTMLifr = "<iframe id=_ifrDown name=_ifrDown width=0 height=0 border=0 src=downloadIfr.aspx?orig=DownloadAreaPublica&arq=" + escape(_nm_arquivo) + "&arqTipo=AREA_PUBLICA></iframe>";
                        jQuery('#divArquivos').html(strHTMLifr);

                        break;

                    }
                }
            }
        });
    }
    else {
        _limpaSelecao();
        globalctlGetLoteamentoLatLon.activate();
        document.getElementById('drag').style.display = "none";
        $('div.olLayerDiv').css('cursor', 'crosshair');
    }

}


/*********************************************************
Nome: inativaSelecao()
Objetivo: Inativa o controle de Seleção
Parâmetro(s):
Disparador(es):
**********************************************************/
/*inativaSelecao = function () {
if (habilitaSelecao == true) {
globalctlBtnSelecao.panel_div.className = globalctlBtnSelecao.displayClass + "ItemInactive olButton";
} else {
globalctlBtnSelecao.panel_div.className = globalctlBtnSelecao.displayClass + "ItemInactiveTransparent olButton";
}
document.getElementById('selecao').style.display = 'none';

//remove o controle getfeature de selecao criado dinamicamente
//removeControle(globalctlSelecaoGetFeatureDinamico);
}*/






/*********************************************************
Nome: carregaGridLogradouro()
Objetivo: Monta e exibe grid com pesquisa de logradouros
Parâmetro(s): logs - objeto de retorno do tipo "List(Of clsListaLocalidadeVO)"
Disparador(es): onSuccessPesqLog() - callback de sucesso da função pesquisaLogradouro()
*********************************************************/
carregaGridLogradouro = function (logs, nrLog) {

    var limite;

    //Caso não tenha registros exibe mensagem de erro e sai da função
    if (logs.length == 0) {
        jAlert('Não há registros para a pesquisa efetuada.', 'Mensagem', function () { });
        jQuery('#localGrid').html('');
        closeloading();
        return false;
    }

    //Monta array com identificadores e links para seleção do logradouro
    var strLogs = "[";
    for (var i = 0; i < logs.length; i++) {
        /*
        var codLog = logs[i]['COD_LOG'];
        var x = logs[i]['X'];
        var y = logs[i]['Y'];

        var bairro = logs[i]['BAIRRO'];
        bairro = (bairro != '' && bairro != null) ? bairro : '';
        var localidade = logs[i]['LOCALIDADE'];
        */
        /*var codLog = logs[i]['COD_LOG'];
        var dvCodLog = logs[i]['DV_COD_LOG'];*/
        var localidade = logs[i]['LOCALIDADE'];
        var codIdLog = logs[i]['COD_ID_LOG'];
        limite = logs[i]['SUP_LIMITE'];

        //var strLinkHTML = "<a href=javascript:void(0); onclick=javascript:exibeLogradouroSelecionado('" + codLog + "','" + x + "','" + y + "'); style='font-size: 10px;'>" + localidade + "</a>";
        //var strLinkHTML = "<a href=javascript:void(0); onclick=javascript:exibeLogradouroSelecionado('" + codLog + "','" + dvCodLog + "','" + nrLog + "'); style='font-size: 10px;'>" + localidade + "</a>";
        var strLinkHTML = "<a href=javascript:void(0); onclick=javascript:exibeLogradouroSelecionado('','" + codIdLog + "','" + nrLog + "'); style='font-size: 10px;'>" + localidade + "</a>";

        //strLogs += "{ Logradouro: \"" + strLinkHTML + "\", Bairro: \"" + bairro + "\" },";
        strLogs += "{ Logradouro: \"" + strLinkHTML + "\" },";
    }
    strLogs = strLogs.substring(0, strLogs.length - 1);
    strLogs += "]";
    var arrLogs = eval(strLogs);
    debug = arrLogs;

    //Prepara os elementos HTML para montagem do grid 
    var rnd = (Math.random()).toString().replace('.', '').substring(0, 5);
    var idT = 'T_' + rnd;
    var idP = 'P_' + rnd;
    var idM = 'M_' + rnd;

    var strHTMLtbl = "<table id=" + idT + "></table>";
    var strHTMLpgr = "<div id=" + idP + "></div>";
    jQuery('#localGrid').html(strHTMLtbl + strHTMLpgr);

    //jQuery('#lblPopup').html('Pesquisa de Logradouros');

    //Caso a pesquisa retorno mais de 100 registros exibe a mensagem de que parte do resultado pode ter sido omitido
    //if (logs.length > 100) {
    //24/04/2014
    if (limite == 'S') {
        var strHTMLmsg = "<label style='font-size :10px; color:Black;' id=" + idM + ">O número de resultados encontrados é superior a 100, por este motivo, parte do resultado pode ter sido omitido. Caso o logradouro desejado não esteja entre os itens exibidos na relação, por favor, refine sua pesquisa.</label>";
        jQuery('#localGrid').append(strHTMLmsg);
    }

    var grid = jQuery('#' + idT);
    //debug = grid;  

    //Função que instancia o componente jqGrid
    montaGridLogradouros = function () {
        grid.jqGrid({
            datatype: "local",
            data: arrLogs,
            height: "auto",
            colNames: ['Logradouro'],
            colModel: [
	                        { name: 'Logradouro', index: 'Logradouro', width: '460', sortable: false }
            /*{ name: 'Bairro', index: 'Bairro', width: '150', title: false, sortable: false }*/
            ],
            multiselect: false,
            caption: "",
            pager: idP,
            rowNum: 5,
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
    //Chamada da função que monta e exibe o grid
    montaGridLogradouros();

}


/*********************************************************
Nome: carregaGridLogradouroLote()
Objetivo: Monta e exibe grid com pesquisa de logradouros
Parâmetro(s): logs - objeto de retorno do tipo "List(Of clsListaLocalidadeVO)"
Disparador(es): onSuccessPesqLog() - callback de sucesso da função pesquisaLogradouro()
*********************************************************/
carregaGridLogradouroLote = function (logs) {

    var limite;

    //Caso não tenha registros exibe mensagem de erro e sai da função
    if (logs.length == 0) {
        jAlert('Não há registros para a pesquisa efetuada.', 'Mensagem', function () { });
        jQuery('#tdGridEnderecoLote').html('');
        closeloading();
        return false;
    }

    //Monta array com identificadores e links para seleção do logradouro
    var strLogs = "[";
    for (var i = 0; i < logs.length; i++) {
        /*
        var codLog = logs[i]['COD_LOG'];
        var x = logs[i]['X'];
        var y = logs[i]['Y'];

        var bairro = logs[i]['BAIRRO'];
        bairro = (bairro != '' && bairro != null) ? bairro : '';
        var localidade = logs[i]['LOCALIDADE'];
        */
        var codLog = logs[i]['COD_LOG'];
        var dvCodLog = logs[i]['DV_COD_LOG'];
        var localidade = logs[i]['LOCALIDADE'];
        limite = logs[i]['SUP_LIMITE'];

        var strLinkHTML = "<a id=lnkEndLote_" + codLog + "_" + dvCodLog + " href=Javascript:void(0); onclick=Javascript:exibeLogradouroLoteSelecionado('" + codLog + "','" + dvCodLog + "'); style='font-size: 10px;'>" + localidade + "</a>";
        //strLogs += "{ Logradouro: \"" + strLinkHTML + "\", Bairro: \"" + bairro + "\" },";
        strLogs += "{ Logradouro: \"" + strLinkHTML + "\" },";
    }
    strLogs = strLogs.substring(0, strLogs.length - 1);
    strLogs += "]";
    var arrLogs = eval(strLogs);
    debug = arrLogs;

    //Prepara os elementos HTML para montagem do grid 
    var rnd = (Math.random()).toString().replace('.', '').substring(0, 5);
    var idT = 'T_' + rnd;
    var idP = 'P_' + rnd;
    var idM = 'M_' + rnd;

    var strHTMLtbl = "<table id=" + idT + "></table>";
    var strHTMLpgr = "<div id=" + idP + "></div>";
    jQuery('#tdGridEnderecoLote').html(strHTMLtbl + strHTMLpgr);

    //jQuery('#lblPopup').html('Pesquisa de Logradouros');

    //Caso a pesquisa retorno mais de 100 registros exibe a mensagem de que parte do resultado pode ter sido omitido
    //if (logs.length > 100) {
    if (limite == 'S') {
        var strHTMLmsg = "<label style='font-size :10px;' id=" + idM + ">O número de resultados encontrados é superior a 100, por este motivo, parte do resultado pode ter sido omitido. Caso o logradouro desejado não esteja entre os itens exibidos na relação, por favor, refine sua pesquisa.</label>";
        jQuery('#tdGridEnderecoLote').append(strHTMLmsg);
    }

    var grid = jQuery('#' + idT);
    //debug = grid;  

    //Função que instancia o componente jqGrid
    montaGridLogradouros = function () {
        grid.jqGrid({
            datatype: "local",
            data: arrLogs,
            height: "auto",
            colNames: ['Logradouro'],
            colModel: [
	                        { name: 'Logradouro', index: 'Logradouro', width: '480', sortable: false }
            /*{ name: 'Bairro', index: 'Bairro', width: '150', title: false, sortable: false }*/
            ],
            multiselect: false,
            caption: "",
            pager: idP,
            rowNum: 5,
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
    //Chamada da função que monta e exibe o grid
    montaGridLogradouros();

}


voltaPesquisaLogradouroLote = function () {
    jQuery('#tblPesqLogLote').css('display', 'block');
    jQuery('#tblPesqLogLote2').css('display', 'none');
}

ListarIntegracaoSOF = function () {
    if (document.getElementById('cboSubIntegracao').value == "0" || document.getElementById('cboSubIntegracao').value == "") {
        alert('Favor selecionar a subprefeitura');
        return false;
    };

    //$('#lblIntegracao').html('Subprefeitura:' + document.getElementById('cboSubIntegracao').value);
    $('#lblIntegracao').html('Subprefeitura: ' + document.getElementById('cboSubIntegracao').selectedOptions[0].text);

    var Sub = $('#cboSubIntegracao').val();

    urlWS = "_SBC.aspx/pesquisaLoteIntegracaoSOF";

    $.ajax({
        url: urlWS,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        type: "POST",
        data: "{ 'pCdSub': '" + Sub + "' }",
        success: function (data) {
            globalSubPrefeituraIntegracao = Sub;
            TrataJsonIntegracao(data, "96");
        }
    });
}



/*********************************************************
Nome: ListarIntegracao()
Objetivo: Chama webservice de integração
**********************************************************/
ListarIntegracao = function () {
    var cmbTipo = $('#cboSerieIntegracao').val();
    if (validaParametrosIntegracao(cmbTipo) == true) {

        var Setor = $('#TxtIntSetor').val();
        var Quadra = $('#TxtIntQuadra').val();
        var Lote = $('#TxtIntLote').val();
        var CodLog = $('#TxtCodlog').val();
        var urlWS = "";


        loading();

        //SLC-e
        if (cmbTipo == "1") /*SLC-e*/ {
            /*h ttp://webdesenv5.prodam/DU0110_Integracao/api/SLC/070/248/0105*/
            //urlWS = "http://localhost/DU0110_Integracao/api/SLC/" + Setor + "/" + Quadra + "/" + Lote;
            urlWS = "http://webdesenv5.prodam/DU0110_Integracao/api/SLC/" + Setor + "/" + Quadra + "/" + Lote;

            $.ajax({
                url: urlWS,
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                success: function (data) {
                    TrataJsonIntegracao(data, cmbTipo);
                }
            });
        } else if (cmbTipo == "2") /*CEDI*/ {
            /*h ttp://webdesenv5.prodam/DU0110_Integracao/api/CEDI/100/300/138*/
            //urlWS = "http://localhost/DU0110_Integracao/api/CEDI/" + Setor + "/" + Quadra + "/" + Lote;
            urlWS = "http://webdesenv5.prodam/DU0110_Integracao/api/CEDI/" + Setor + "/" + Quadra + "/" + Lote;


            $.ajax({
                url: urlWS,
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                success: function (data) {
                    TrataJsonIntegracao(data, cmbTipo);
                }
            });
        } else if (cmbTipo == "7") /*Filiação*/ {
            /*http: //webdesenv5.prodam/DU0110_Integracao/api/Filiacao/1/3/25*/
            urlWS = "http://localhost/DU0110_Integracao/api/Filiacao/" + Setor + "/" + Quadra + "/" + Lote;
            //urlWS = "http://webdesenv5.prodam/DU0110_Integracao/api/Filiacao/" + Setor + "/" + Quadra + "/" + Lote;

            $.ajax({
                url: urlWS,
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                success: function (data) {
                    TrataJsonIntegracao(data, cmbTipo);
                }
            });
        } else if (cmbTipo == "11") /*TPCL*/ {

            //captcha desabilitado para TPCL. Caso seja necessário habilitar o captcha para este serviço, basta descomentar o código abaixo.

            //if (!trataPesquisaCaptcha('ListarIntegracao()')) return false;

            //fechaPopupCaptcha();

            //var cp = $('#txtValorCaptcha').val();
            //var str = $('#__strVal').val();

            //urlWS = "_SBC.aspx/pesquisaLoteIntegracaoTPCL";

            //$.ajax({
            //    url: urlWS,
            //    contentType: "application/json; charset=utf-8",
            //    dataType: "json",
            //    type: "POST",
            //    data: "{ 'cp': '" + cp + "', 'str': '" + str + "', 'pCdSetor': '" + Setor + "', 'pCdQuadra': '" + Quadra + "', 'pCdLote': '" + Lote + "' }",
            //    success: function (data) {
            //        TrataJsonIntegracao(data, cmbTipo);
            //        RefreshCaptcha();
            //    },
            //    error: function (err) {
            //        closeloading();
            //        jAlert($.parseJSON(err.responseText).Message, 'Mensagem', function () { });
            //        RefreshCaptcha();
            //        return false;
            //    }
            //});

            //if (!trataPesquisaCaptcha('ListarIntegracao()')) return false;

            //fechaPopupCaptcha();

            //var cp = $('#txtValorCaptcha').val();
            //var str = $('#__strVal').val();

            urlWS = "_SBC.aspx/pesquisaLoteIntegracaoTPCL";

            $.ajax({
                url: urlWS,
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                type: "POST",
                data: "{ 'pCdSetor': '" + Setor + "', 'pCdQuadra': '" + Quadra + "', 'pCdLote': '" + Lote + "' }",
                success: function (data) {
                    TrataJsonIntegracao(data, cmbTipo);
                    RefreshCaptcha();
                },
                error: function (err) {
                    closeloading();
                    jAlert($.parseJSON(err.responseText).Message, 'Mensagem', function () { });
                    return false;
                }
            });

        } else if (cmbTipo == "12") /*CADLOG*/ {

            urlWS = "_SBC.aspx/pesquisaLoteIntegracaoCADLOG";

            $.ajax({
                url: urlWS,
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                type: "POST",
                data: "{ 'pCodLog': '" + CodLog + "' }",
                success: function (data) {
                    TrataJsonIntegracao(data, cmbTipo);
                }
            });
        } else if (cmbTipo == "13") /*CADTEC*/ {

            urlWS = "_SBC.aspx/pesquisaLoteIntegracaoCADTEC";

            $.ajax({
                url: urlWS,
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                type: "POST",
                data: "{ 'pCodLog': '" + CodLog + "' }",
                success: function (data) {
                    TrataJsonIntegracao(data, cmbTipo);
                }
            });
        }

        LimpaPesquisaIntegracao();
    }

}

/*********************************************************
Nome: ListarIntegracaoSLC()
Objetivo: Chama webservice de integração
Pri
**********************************************************/
ListarIntegracaoSLC = function () {

    if (validaParametrosIntegracaoSLC() == true) {

        var Setor = $('#txtSetorSLC').val();
        var Quadra = $('#txtQuadraSLC').val();
        var Lote = $('#txtLoteSLC').val();
        var urlWS = "";


        loading();

        function onSuccessPesqURL1(result) {
            globalLoteIntegracao = Lote;
            globalSetorIntegracao = Setor;
            globalQuadraIntegracao = Quadra;
            TrataJsonIntegracaoSLC(JSON.parse(result));
        }
        function onErrorPesqURL1(desc) {
            console.log(desc);
            closeloading();
        }

        PageMethods.ConsomeWSIntegracao("SLC", Setor, Quadra, Lote, onSuccessPesqURL1, onErrorPesqURL1);



        ////SLC-e        
        ///*h ttp://webdesenv5.prodam/DU0110_Integracao/api/SLC/070/248/0105*/
        ////urlWS = "http://localhost/DU0110_Integracao/api/SLC/" + Setor + "/" + Quadra + "/" + Lote;
        //urlWS = "http://webdesenv5.prodam/DU0110_Integracao/api/SLC/" + Setor + "/" + Quadra + "/" + Lote;

        //$.ajax({
        //    url: urlWS,
        //    contentType: "application/json; charset=utf-8",
        //    dataType: "json",
        //    success: function (data) {
        //        TrataJsonIntegracaoSLC(data);
        //    },
        //    error: function (err) {
        //        closeloading();               
        //        return false;
        //    }
        //});

        //LimpaPesquisaIntegracaoSLC();
    }

}

/*********************************************************
Nome: fecharIntegracaoSISZON()
Objetivo: refresh do captcha para integração do SISZON
**********************************************************/
fecharIntegracaoSISZON = function () {
    $('#divDadosIntegracao')[0].style.display = 'none';
    $('#divSituacaoIntegracao')[0].style.display = 'none';
    renovaSession(5);
    RefreshCaptcha();
}

/*********************************************************
Nome: ListarIntegracaoSISZON()
Objetivo: Chama webservice de integração do SISZON
**********************************************************/
ListarIntegracaoSISZON = function () {
    var cmbTipo = $('#cboSerieIntegracaoSISZON').val();
    if (validaParametrosIntegracaoSISZON(cmbTipo) == true) {

        var SetorSISZON = $('#TxtSetorSISZON').val();
        var QuadraSISZON = $('#TxtQuadraSISZON').val();
        var LoteSISZON = $('#TxtLoteSISZON').val();
        var urlWS = "";

        $("#hdnContentReport").val(SetorSISZON + "." + QuadraSISZON + "." + LoteSISZON);

        loading();


        if (cmbTipo == "16") /*SISZON*/ {

            window.clearInterval(sessionRenovaInterval);

            urlWS = "_SBC.aspx/pesquisaLoteIntegracaoSISZON";

            $.ajax({
                url: urlWS,
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                type: "POST",
                data: "{'pCdSetor': '" + SetorSISZON + "', 'pCdQuadra': '" + QuadraSISZON + "', 'pCdLote': '" + LoteSISZON + "' }",
                success: function (data) {
                    TrataJsonIntegracao(data, cmbTipo);
                    //RefreshCaptcha();
                },
                error: function (err) {
                    closeloading();
                    jAlert($.parseJSON(err.responseText).Message, 'Mensagem', function () { });
                    return false;
                }
            });
        }

        LimpaPesquisaIntegracaoSISZON();
    }

}

//captcha desabilitado para SISZON. Caso seja necessário habilitar o captcha para este serviço, basta descomentar o código abaixo.

//ListarIntegracaoSISZON = function () {
//    var cmbTipo = $('#cboSerieIntegracaoSISZON').val();
//    if (validaParametrosIntegracaoSISZON(cmbTipo) == true) {

//        var SetorSISZON = $('#TxtSetorSISZON').val();
//        var QuadraSISZON = $('#TxtQuadraSISZON').val();
//        var LoteSISZON = $('#TxtLoteSISZON').val();
//        var urlWS = "";

//        $("#hdnContentReport").val(SetorSISZON + "." + QuadraSISZON + "." + LoteSISZON);

//        loading();


//        if (cmbTipo == "16") /*SISZON*/ {

//            window.clearInterval(sessionRenovaInterval);

//            if (!trataPesquisaCaptcha('ListarIntegracaoSISZON()')) return false;

//            fechaPopupCaptcha();

//            var cp = $('#txtValorCaptcha').val();
//            var str = $('#__strVal').val();

//            urlWS = "_SBC.aspx/pesquisaLoteIntegracaoSISZON";

//            $.ajax({
//                url: urlWS,
//                contentType: "application/json; charset=utf-8",
//                dataType: "json",
//                type: "POST",
//                data: "{ 'cp': '" + cp + "', 'str': '" + str + "', 'pCdSetor': '" + SetorSISZON + "', 'pCdQuadra': '" + QuadraSISZON + "', 'pCdLote': '" + LoteSISZON + "' }",
//                success: function (data) {
//                    TrataJsonIntegracao(data, cmbTipo);
//                    //RefreshCaptcha();
//                },
//                error: function (err) {
//                    closeloading();
//                    jAlert($.parseJSON(err.responseText).Message, 'Mensagem', function () { });
//                    RefreshCaptcha();
//                    return false;
//                }
//            });
//        }

//        LimpaPesquisaIntegracaoSISZON();
//    }

//}

/*********************************************************
Nome: fecharIntegracaoCIT()
Objetivo: refresh do captcha para integração do CIT
**********************************************************/
fecharIntegracaoCIT = function () {
    jQuery('#divDadosIntegracaoCIT').hide();
    jQuery('#divSituacaoIntegracaoCIT').hide();
    jQuery('#divNotaExplicativa').hide();
    jQuery('#divTextoAdicional').hide();
    renovaSession(5);
    RefreshCaptcha();
}

/*********************************************************
Nome: ListarIntegracaoCIT()
Objetivo: Chama webservice de integração do CIT
**********************************************************/
ListarIntegracaoCIT = function () {
    var cmbTipo = $('#cboSerieIntegracaoCIT').val();
    if (validaParametrosIntegracaoCIT() == true) {

        var Setor = $('#TxtSetorCIT').val();
        var Quadra = $('#TxtQuadraCIT').val();
        var Lote = $('#TxtLoteCIT').val();              

        loading();        

        window.clearInterval(sessionRenovaInterval);
       
        urlWS = "_SBC.aspx/pesquisaIntegracaoCIT";

        $.ajax({
            url: urlWS,            
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            type: "POST",
            data: "{'setor': '" + Setor + "', 'quadra': '" + Quadra + "', 'lote': '" + Lote + "' }",
            success: function (data) {
                TrataJSONIntegracaoCIT($.parseJSON(data.d)[0]);
            },
            error: function (err) {
                closeloading();
                jAlert($.parseJSON(err.responseText).Message, 'Mensagem', function () { });
                return false;
            }
        });
               
        LimpaPesquisaIntegracaoCIT();
    }
}

//captcha desabilitado para CIT. Caso seja necessário habilitar o captcha para este serviço, basta descomentar o código abaixo.

//ListarIntegracaoCIT = function () {
//    var cmbTipo = $('#cboSerieIntegracaoCIT').val();
//    if (validaParametrosIntegracaoCIT() == true) {

//        var Setor = $('#TxtSetorCIT').val();
//        var Quadra = $('#TxtQuadraCIT').val();
//        var Lote = $('#TxtLoteCIT').val();              

//        loading();        

//        window.clearInterval(sessionRenovaInterval);

//        if (!trataPesquisaCaptcha("ListarIntegracaoCIT()")) return false;

//        fechaPopupCaptcha();

//        var cp = $('#txtValorCaptcha').val();
//        var str = $('#__strVal').val();
       
//        urlWS = "_SBC.aspx/pesquisaIntegracaoCIT";

//        $.ajax({
//            url: urlWS,            
//            contentType: "application/json; charset=utf-8",
//            dataType: "json",
//            type: "POST",
//            data: "{ 'cp': '" + cp + "', 'str': '" + str + "', 'setor': '" + Setor + "', 'quadra': '" + Quadra + "', 'lote': '" + Lote + "' }",
//            success: function (data) {
//                TrataJSONIntegracaoCIT($.parseJSON(data.d)[0]);
//            },
//            error: function (err) {
//                closeloading();
//                jAlert($.parseJSON(err.responseText).Message, 'Mensagem', function () { });
//                RefreshCaptcha();
//                return false;
//            }
//        });
               
//        LimpaPesquisaIntegracaoCIT();
//    }
//}

/*********************************************************
Nome: validaParametrosIntegracao()
Objetivo: Valida os parametros da tela de integração
**********************************************************/
function validaParametrosIntegracao(tipo) {

    /*"0" = nenhum
    "1" = SLC-e
    "2" = CEDI
    "3" = Outorga Onerosa
    "4" = CIT
    "5" = SISACOE
    "6" = CCM
    "7" = Filiação
    "8" = SIGAC
    "9" = STCA
    "10" = SAC
    "11" = TPCL
    "12" = CADLOG
    "13" = CADTEC
    "14" = DNE*/

    if (tipo == 11) {
       $("#lblSLC").html('IPTU - Imposto Predial Territorial Urbano');
    }
     $('#lblIntegracao').html('');

    if (tipo == "1" || tipo == "2" || tipo == "4" || tipo == "7" || tipo == "11") {
        if (document.getElementById("TxtIntSetor").value == "") {
            alert('Favor preencher o Setor');
            return false;
        };

        if (document.getElementById("TxtIntQuadra").value == "") {
            alert('Favor preencher a Quadra');
            return false;
        };

        if (document.getElementById("TxtIntLote").value == "") {
            alert('Favor preencher o Lote');
            return false;
        };


        $('#lblIntegracao').html('SQL:' + document.getElementById("TxtIntSetor").value + '.' + document.getElementById("TxtIntQuadra").value + '.' + document.getElementById("TxtIntLote").value);
    } else if (tipo == "12" || tipo == "13") {
        if (TxtCodlog.value == "") {
            alert('Favor preencher o CODLOG');
            return false;
        };

        $('#lblIntegracao').html('CODLOG:' + TxtCodlog.value);
    } else if (tipo == "10") {

        if (cboSubIntegracao.value == "") {
            alert('Favor selecionar a subprefeitura');
            return false;
        };

        $('#lblIntegracao').html('Subprefeitura:' + cboSubIntegracao.value);
    } else if (tipo == "14") {

        if (TxtIntCep.value == "") {
            alert('Favor selecionar o CEP');
            return false;
        };

        $('#lblIntegracao').html('CEP:' + TxtIntCep.value);
    } else if (tipo == "0") /*Nenhum*/ {
        alert("Por favor selecione o tipo de integração");
    };

    return true;


}

/*********************************************************
Nome: validaParametrosIntegracaoSLC()
Objetivo: Valida os parametros da tela de integração
Pri
**********************************************************/
function validaParametrosIntegracaoSLC() {

    $('#lblIntegracao').html('');

    if (document.getElementById("txtSetorSLC").value == "") {
        alert('Favor preencher o Setor');
        return false;
    };

    if (document.getElementById("txtQuadraSLC").value == "") {
        alert('Favor preencher a Quadra');
        return false;
    };

    if (document.getElementById("txtLoteSLC").value == "") {
        alert('Favor preencher o Lote');
        return false;
    };

    $("#lblSLC").html('SLC-e - Sistema Licenciamento Eletrônico');
    $('#lblIntegracao').html('SQL:' + document.getElementById("txtSetorSLC").value + '.' + document.getElementById("txtQuadraSLC").value + '.' + document.getElementById("txtLoteSLC").value);
    //$('#lblIntegracao').html('SLC-e - Sistema de Licenciamento Eletrônico <br/>' + 'SQL:' + document.getElementById("TxtIntSetor").value + '.' + document.getElementById("TxtIntQuadra").value + '.' + document.getElementById("TxtIntLote").value);
    return true;


}

/*********************************************************
Nome: validaParametrosIntegracaoSISZON()
Objetivo: Valida os parametros da tela de integração do SISZON
**********************************************************/
function validaParametrosIntegracaoSISZON(tipo) {


    $('#lblIntegracao').html('');

    if (tipo == "16") {
        if (document.getElementById("TxtSetorSISZON").value == "") {
            alert('Favor preencher o Setor');
            return false;
        };

        if (document.getElementById("TxtQuadraSISZON").value == "") {
            alert('Favor preencher a Quadra');
            return false;
        };

        if (document.getElementById("TxtLoteSISZON").value == "") {
            alert('Favor preencher o Lote');
            return false;
        };
        $('#lblIntegracao').html('SQL:' + document.getElementById("TxtSetorSISZON").value + '.' + document.getElementById("TxtQuadraSISZON").value + '.' + document.getElementById("TxtLoteSISZON").value);
        $("#lblSLC").html('SISZON - Sistema de Zoneamento');

    };

    return true;
}

/*********************************************************
Nome: validaParametrosIntegracaoCIT()
Objetivo: Valida os parametros da tela de integração do CIT
**********************************************************/
function validaParametrosIntegracaoCIT() {
    $('#lblIntegracaoCIT').html('');
    
    if (document.getElementById("TxtSetorCIT").value == "") {
        alert('Favor preencher o Setor');
        return false;
    };

    if (document.getElementById("TxtQuadraCIT").value == "") {
        alert('Favor preencher a Quadra');
        return false;
    };

    if (document.getElementById("TxtLoteCIT").value == "") {
        alert('Favor preencher o Lote');
        return false;
    };

    $('#lblIntegracaoCIT').html('SQL:' + document.getElementById("TxtSetorCIT").value + '.' + document.getElementById("TxtQuadraCIT").value + '.' + document.getElementById("TxtLoteCIT").value);
    $("#lblCIT").html('CIT - Cadastro de Imóveis Tombados');    

    return true;
}

function LimpaPesquisaIntegracao() {
    /*********************************************************
    Nome: LimpaPesquisaIntegracao()
    Objetivo: limpa os parametros da tela de integração
    **********************************************************/

    //a linha abaixo foi comentada para manter-se sempre a integração IPTU no combo
    //cboSerieIntegracao.value = "0"
    document.getElementById("TxtIntSetor").value = "";
    document.getElementById("TxtIntQuadra").value = "";
    document.getElementById("TxtIntLote").value = "";
    //TxtCodlog.value = "";
    //cboSubIntegracao.value = "0";
    //TxtIntCep.value = "";

}

function LimpaPesquisaIntegracaoSLC() {
    /*********************************************************
    Nome: LimpaPesquisaIntegracaoSLC()
    Objetivo: limpa os parametros da tela de integração
    Pri
    **********************************************************/
    document.getElementById("txtSetorSLC").value = "";
    document.getElementById("txtQuadraSLC").value = "";
    document.getElementById("txtLoteSLC").value = "";
}

function LimpaPesquisaIntegracaoSISZON() {
    /*********************************************************
    Nome: LimpaPesquisaIntegracaoSIZON()
    Objetivo: limpa os parametros da tela de integração
    **********************************************************/
    document.getElementById("TxtSetorSISZON").value = "";
    document.getElementById("TxtQuadraSISZON").value = "";
    document.getElementById("TxtLoteSISZON").value = "";
}

function LimpaPesquisaIntegracaoCIT() {
    /*********************************************************
    Nome: LimpaPesquisaIntegracaoCIT()
    Objetivo: limpa os parametros da tela de integração
    **********************************************************/
    document.getElementById("TxtSetorCIT").value = "";
    document.getElementById("TxtQuadraCIT").value = "";
    document.getElementById("TxtLoteCIT").value = "";
}


function mudaSerieIntegracao(tipo) {

    /*"0" = nenhum
    "1" = SLC-e
    "2" = CEDI
    "3" = Outorga Onerosa
    "4" = CIT
    "5" = SISACOE
    "6" = CCM
    "7" = Filiação
    "8" = SIGAC
    "9" = STCA
    "10" = SAC
    "11" = TPCL
    "12" = CADLOG
    "13" = CADTEC
    "14" = DNE*/

    LimpaPesquisaIntegracao();
    TxtIntSetor.disabled = true;
    TxtIntQuadra.disabled = true;
    TxtIntLote.disabled = true;
    TxtCodlog.disabled = true;
    cboSubIntegracao.disabled = true;
    TxtIntCep.disabled = true;

    $('#fsSQL')[0].style.opacity = '0.3';
    $('#fsCEP')[0].style.opacity = '0.3';
    $('#fsCodLog')[0].style.opacity = '0.3';
    $('#fsSub')[0].style.opacity = '0.3';


    if (tipo == "1" || tipo == "2" || tipo == "3" || tipo == "4" || tipo == "5" || tipo == "6" || tipo == "7" || tipo == "8" || tipo == "9" || tipo == "11") {
        TxtIntSetor.disabled = false;
        TxtIntQuadra.disabled = false;
        TxtIntLote.disabled = false;
        $('#fsSQL')[0].style.opacity = '1';
    } else if (tipo == "12" || tipo == "13") {
        TxtCodlog.disabled = false;
        $('#fsCodLog')[0].style.opacity = '1';
    } else if (tipo == "10") {
        cboSubIntegracao.disabled = false;
        $('#fsSub')[0].style.opacity = '1';
    } else if (tipo == "14") {
        TxtIntCep.disabled = false;
        $('#fsCEP')[0].style.opacity = '1';
    };
}

/*********************************************************
Nome: TrataJSONIntegracaoCIT()
Objetivo: Trata o XML retornado do WebService e chama o carregamento do grid com as informações
**********************************************************/
function TrataJSONIntegracaoCIT(json) {
    var table = "";
    
    var sql = (json.CodigoSetor == null || json.CodigoQuadra == null || json.CodigoLote == null) ? "" : json.CodigoSetor + "." + json.CodigoQuadra + "." + json.CodigoLote + "-" + json.CodigoDigito;
    var endereco = json.Endereco == null ? "" : json.Endereco;
    var nomeFantasia = json.NomeFantasia == null ? "" : json.NomeFantasia;
    var codigoMensagem = json.CodigoMensagem == null ? "" : json.CodigoMensagem;
    var observacao = json.Observacao == null ? "" : json.Observacao;
    var dataConsulta = json.DataConsulta == null ? "" : FormatarDataHora(json.DataConsulta);
    var indicativoCertidao = json.IndicativoCertidao == null ? "" : json.IndicativoCertidao;
    var descricaoCertidao = json.DescricaoCertidao == null ? "" : json.DescricaoCertidao.replace("[ENDERECO]", endereco).replace("[SQL]", sql).replace("[OBSERVACAO]", observacao).replace("[DENOMINACAO]", nomeFantasia);

    $('#divSituacaoIntegracao')[0].style.display = 'none';
    $('#gridDadosIntegracao')[0].style.display = 'none';
    $('#gridDadosIntegracaoB')[0].style.display = 'none';
    $('#gridDadosIntegracaoC')[0].style.display = 'none';

    $('#lblIntegracao').html('SQL:' + sql);
    $('#lblIntegracaoEndereco').html(endereco);

    //jQuery(XMLIntegracao).find("Tombamento").each(function () {        
    table += "{ feature: '" + "Nome Fantasia" + "', valor: '" + nomeFantasia + "'},";
    table += "{ feature: '" + "Observação" + "', valor: '" + observacao + "'},";
    table += "{ feature: '" + "Endereço" + "', valor: '" + endereco + "'},";      
    //});

    table = "[" + table + "]";
    //remove line breaks de tablec
    tablec = eval(table.replace(/\n|\r/g, ""));   

    carregaGridIntegracaoCIT(3, tablec, descricaoCertidao, sql, dataConsulta, indicativoCertidao, codigoMensagem);
       
    if (indicativoCertidao == "S") {
        $("#hdnTextoCertidao").val(descricaoCertidao);
        $("#hdnDataCertidao").val(dataConsulta);
        $("#lnkVisualizarImpressaoCIT").show();
    } else {
        $("#lnkVisualizarImpressaoCIT").hide();
    }
}

/*********************************************************
Nome: TrataJsonIntegracao()
Objetivo: Trata o Json retornado do WebService e chama o carregamento do grid com as informações
**********************************************************/
function TrataJsonIntegracao(JsonIntegracao, tipo) {
    var table = "";
    var tableP = "";
    var tableF = "";
    var vSqls = "";

    $('#divSituacaoIntegracao')[0].style.display = 'none';
    $('#gridDadosIntegracao')[0].style.display = 'none';
    $('#gridDadosIntegracaoB')[0].style.display = 'none';
    $('#gridDadosIntegracaoC')[0].style.display = 'none';

    $('#divDadosIntegracao').html($('#divDadosIntegracao').html().replace('SOF – Sistema de Orçamento e Finanças', 'Dados de Integraçao'));

    //varre o arquivo JSON
    if (tipo == "1") /*SLC-e*/ {
        jQuery.each((JsonIntegracao), function (jsoni2) {

            table += "{ feature: '" + "Ano Alvará" + "', valor: '" + this.Alvara.Ano + "'},";
            table += "{ feature: '" + "Dt Emissão Alvará" + "', valor: '" + this.Alvara.DataEmissao + "'},";
            table += "{ feature: '" + "Dt Validade Alvará" + "', valor: '" + this.Alvara.DataValidade + "'},";
            table += "{ feature: '" + "Número Alvará" + "', valor: '" + this.Alvara.NumeroAlvara + "'},";

            vSqls = "";
            jQuery.each((this.SQLEnvolvidos), function (jsoni3) {
                vSqls += this.Numero + "/";
            });

            table += "{ feature: '" + "Sqls Envolvidos" + "', valor: '" + vSqls + "'},";

            table += "{ feature: '" + "Motivo Indeferimento" + "', valor: '" + this.MotivoIndeferimento + "'},";
            table += "{ feature: '" + "Assunto" + "', valor: '" + this.NomeAssunto + "'},";
            table += "{ feature: '" + "Num. Processo" + "', valor: '" + this.NumeroProcesso + "'},";
            table += "{ feature: '" + "Situação" + "', valor: '" + this.Situacao + "'},";

        });

        table = "[" + table + "]";
        tablec = eval(table);
        carregaGridIntegracao(9, tablec);
    } else if (tipo == "2") /*CEDI*/ {
        jQuery.each((JsonIntegracao), function (jsoni2) {
            table += "{ feature: '" + "NumeroProcesso" + "', valor: '" + this.NumeroProcesso + "'},";
            table += "{ feature: '" + "Situacao" + "', valor: '" + this.Situacao + "'},";
            table += "{ feature: '" + "DataCadastro" + "', valor: '" + this.DataCadastro + "'},";
            table += "{ feature: '" + "IndicativoConsolidacao" + "', valor: '" + this.IndicativoConsolidacao + "'},";
            table += "{ feature: '" + "ObservacaoConsolidacao" + "', valor: '" + this.ObservacaoConsolidacao + "'},";
            table += "{ feature: '" + "TipoEmissao" + "', valor: '" + this.TipoEmissao + "'},";
        });

        table = "[" + table + "]";
        tablec = eval(table);
        var rowNumDinamic = JsonIntegracao.length;  //essa variável será utilizada para fazer a "quebra de página" no grid a cada registro de features.
        carregaGridIntegracao(6, tablec);

    } else if (tipo == "7") /*Filiação*/ {
        var JSituacao = JsonIntegracao.Situacao;

        jQuery.each((JsonIntegracao.SQLs), function (jsoni2) {
            //jQuery.each((this.SQLs), function (jsoni3) {
            if (this.Tipo == "Pai") {
                //tableP += "{ feature: '" + "Setor" + "', valor: '" + this.Setor + "'},";
                //tableP += "{ feature: '" + "Quadra" + "', valor: '" + this.Quadra + "'},";
                //tableP += "{ feature: '" + "Lote" + "', valor: '" + this.Lote + " ao " + this.LoteFim + "'},";

                //tableP += "{ feature: '" + "LoteFim" + "', valor: '" + this.LoteFim + "'},";
                //tableP += "{ feature: '" + "Tipo" + "', valor: '" + this.Tipo + "'},";

                if (this.LoteFim == "0") {
                    tableP += "{ Setor: '" + this.Setor + "', Quadra: '" + this.Quadra + "', Lote: '" + this.Lote + "'},";
                } else {
                    tableP += "{ Setor: '" + this.Setor + "', Quadra: '" + this.Quadra + "', Lote: '" + this.Lote + " ao " + this.LoteFim + "'},";
                }

            } else if (this.Tipo == "Filho") {
                //tableF += "{ feature: '" + "Setor" + "', valor: '" + this.Setor + "'},";
                //tableF += "{ feature: '" + "Quadra" + "', valor: '" + this.Quadra + "'},";
                //tableF += "{ feature: '" + "Lote" + "', valor: '" + this.Lote + " ao " + this.LoteFim + "'},";

                //tableF += "{ feature: '" + "LoteFim" + "', valor: '" + this.LoteFim + "'},";
                //tableF += "{ feature: '" + "Tipo" + "', valor: '" + this.Tipo + "'},";
                if (this.LoteFim == "0") {
                    tableF += "{ Setor: '" + this.Setor + "', Quadra: '" + this.Quadra + "', Lote: '" + this.Lote + "'},";
                } else {
                    tableF += "{ Setor: '" + this.Setor + "', Quadra: '" + this.Quadra + "', Lote: '" + this.Lote + " ao " + this.LoteFim + "'},";
                }
            }
            //});
        });

        tableP = "[" + tableP + "]";
        tableF = "[" + tableF + "]";
        tablec = eval(tableP);
        tabled = eval(tableF);
        carregaGridIntegracaoB(7, tablec);
        carregaGridIntegracaoC(7, tabled);

        //Mostra a situação antes do grid
        $('#lblSituacaoIntegracao').html(JSituacao);
        $('#divSituacaoIntegracao')[0].style.display = 'block';

    } else if (tipo == "11") /*TPCL*/ {

        jQuery.each((JsonIntegracao), function (jsoni2) {

            jQuery.each((this), function (jsoni3) {
                table += "{ feature: '" + "Setor" + "', valor: '" + this.Setor + "'},";
                table += "{ feature: '" + "Quadra" + "', valor: '" + this.Quadra + "'},";
                table += "{ feature: '" + "Lote" + "', valor: '" + this.Lote + "'},";
                table += "{ feature: '" + "Situação" + "', valor: '" + this.Situacao + "'},";
                table += "{ feature: '" + "Dígito SQL" + "', valor: '" + this.DigitoSQL + "'},";
                table += "{ feature: '" + "Condomínio" + "', valor: '" + this.Condominio + "'},";
                table += "{ feature: '" + "Nome do Logradouro" + "', valor: '" + this.NomeLogradouro.replace(/'/g, "\\'") + "'},";
                table += "{ feature: '" + "Número da Porta" + "', valor: '" + this.NrPorta + "'},";
                table += "{ feature: '" + "Tipo de Uso" + "', valor: '" + this.TipoUso + "'},";
                table += "{ feature: '" + "Tipo do terreno" + "', valor: '" + this.TipoTerreno + "'},";
                table += "{ feature: '" + "Área do terreno" + "', valor: '" + this.AreaTerreno + "'},";
                table += "{ feature: '" + "Área construída" + "', valor: '" + this.AreaConstruida + "'},";
                table += "{ feature: '" + "Código CIB" + "', valor: '" + this.CdCib + "'},";
                table += "{ feature: '" + "Situação do código CIB" + "', valor: '" + this.TxSituacaoCib + "'},";
            });
        });

        table = "[" + table + "]";
        tablec = eval(table);
        jQuery('#divJanelaDados').css('height', '395px');
        jQuery('#divDadosIntegracao').css('height', '455px');
        carregaGridIntegracao(15, tablec);
        // $('#lblIntegracao').html(x);
    } else if (tipo == "12") /*CADLOG*/ {

        var dataHeader;
        var lenCeps = 0;

        jQuery.each((JsonIntegracao), function (jsoni2) {

            jQuery.each((this), function (jsoni3) {

                lenCeps = this.Ceps.length;
                dataHeader = this;

                jQuery.each((this.Ceps), function (jsoni4) {

                    table += "{ Cep: '" + this.Cep + "', NumeroInicial: '" + this.NumeroInicial + "', NumeroFinal: '" + this.NumeroFinal + "'},";

                });
            });
        });

        table = "[" + table + "]";
        tablec = eval(table);

        carregaGridIntegracaoCADLOG(lenCeps, tablec, dataHeader);

    } else if (tipo == "13") /*CADTEC*/ {


        var tableAtual = tableAnterior = "";
        var lenAtual = lenAnterior = 0;

        jQuery.each((JsonIntegracao), function (jsoni2) {

            lenAtual = this.listaAtual.length;
            jQuery.each((this.listaAtual), function (jsoni3) {
                tableAtual += "{ Denominacao: '" + this.Denominacao + "', Origem: '" + this.Origem + "'},";
            });

            lenAnterior = this.listaAnterior.length;
            jQuery.each((this.listaAnterior), function (jsoni4) {
                tableAnterior += "{ Sequencia: '" + this.Sequencia + "', Denominacao: '" + this.Denominacao + "', Origem: '" + this.Origem + "', Data: '" + this.Data + "'},";
            });

        });

        tableAtual = eval("[" + tableAtual + "]");
        tableAnterior = eval("[" + tableAnterior + "]");

        carregaGridIntegracaoCADTEC(lenAtual, lenAnterior, tableAtual, tableAnterior);

    } else if (tipo == "96") /*SOF*/ {
        $('#lblIntegracao').html($('#lblIntegracao').html().replace('Subprefeitura', 'Prefeitura Regional'));
        $('#divDadosIntegracao').html($('#divDadosIntegracao').html().replace('Dados de Integraçao', 'SOF – Sistema de Orçamento e Finanças'));

        var tableOrgao = tableFuncao = "";
        var lenOrgao = lenFuncao = 0;

        jQuery.each((JsonIntegracao), function (jsoni2) {

            lenOrgao = this.listaOrgao.length;
            jQuery.each((this.listaOrgao), function (jsoni3) {
                //tableOrgao += "{Subprefeitura: '" + this.Subprefeitura + "', Orgao: '" + this.OrgaoFuncao + "', ValorEmpenhado: '" + converteFloatReal(this.ValorEmpenhado) + "', ValorLiquidado: '" + converteFloatReal(this.ValorLiquidado) + "'},";
                tableOrgao += "{Subprefeitura: '" + this.Subprefeitura.replace(/[']/g, " ") + "', Orgao: '" + this.OrgaoFuncao.replace(/[']/g, " ") + "', ValorEmpenhado: '" + parseFloat(this.ValorEmpenhado.replace(",", ".")).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) + "', ValorLiquidado: '" + parseFloat(this.ValorLiquidado.replace(",", ".")).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) + "'},";
            });

            lenFuncao = this.listaFuncao.length;
            jQuery.each((this.listaFuncao), function (jsoni4) {
                //tableFuncao += "{Subprefeitura: '" + this.Subprefeitura + "', Funcao: '" + this.OrgaoFuncao + "', ValorEmpenhado: '" + converteFloatReal(this.ValorEmpenhado) + "', ValorLiquidado: '" + converteFloatReal(this.ValorLiquidado) + "'},";
                tableFuncao += "{Subprefeitura: '" + this.Subprefeitura.replace(/[']/g, " ") + "', Funcao: '" + this.OrgaoFuncao.replace(/[']/g, " ") + "', ValorEmpenhado: '" + parseFloat(this.ValorEmpenhado.replace(",", ".")).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) + "', ValorLiquidado: '" + parseFloat(this.ValorLiquidado.replace(",", ".")).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) + "'},";
            });

        });

        tableOrgao = eval("[" + tableOrgao + "]");
        tableFuncao = eval("[" + tableFuncao + "]");

        carregaGridIntegracaoSOF(lenOrgao, lenFuncao, tableOrgao, tableFuncao);

    }
    else if (tipo == "16") /*SISZON*/ {

        var tableZoneamento = tableClassViaria = tableParametro = tableQuota = tableNotaParametro = tableQuotaNota = strLegislacao = "";
        var lenZoneamento = lenClassViaria = lenParametro = lenQuota = lenNotaParametro = lenQuotaNota = 0;
        var tpcl;

        jQuery.each((JsonIntegracao), function (jsoni2) {

            if (this.listaZoneamento != null) {
                lenZoneamento = this.listaZoneamento.length;
                jQuery.each((this.listaZoneamento), function (jsoni3) {
                    tableZoneamento += "{ ZonaUso: '" + retornaSiglaZoneamento(TrataVal(this.Sgl_zona)) + "', Descricao: '" + retornaDescZoneamento(TrataVal(this.Sgl_zona), TrataVal(this.Cd_zon.substring(4, 8)), TrataVal(this.Txt_desc_zona)).toUpperCase() + "', Perimetro: '" + TrataVal(this.Cd_zon.substring(4, 8)) + "', Legislacao: '" + TrataVal(this.Cd_tipo_legislacao) + " " + TrataVal(this.Numero_legislacao) + "/" + TrataVal(this.Ano_legislacao) + "'},";
                });
            }

            //console.log(tableZoneamento);

            //if (this.listaClassViaria != null) {
            //    lenClassViaria = this.listaClassViaria.length;
            //    jQuery.each((this.listaClassViaria), function (jsoni4) {
            //        tableClassViaria += "{ ClassificacaoViaria: '" + retornaDescClassViaria(TrataVal(this.Cod_claf_viar)) + "', CODLOG: '" + TrataVal(this.Nom_codlog) + "', Logradouro: '" + TrataVal(this.Txt_dcr_log.replace(/'/g, "\\'")) + "', Legislacao: '" + "L 16050/2014" + "'},";
            //    });
            //}

            if (this.listaClassViaria != null) {
                lenClassViaria = this.listaClassViaria.length;               
                jQuery.each((this.listaClassViaria), function (jsoni4) {
                    if (TrataVal(this.Cod_nro_legc_zon) != "" && TrataVal(this.Ano_legc_zon) != "") {
                        strLegislacao = TrataVal(this.Cod_tip_legc_zon) + " " + TrataVal(this.Cod_nro_legc_zon) + "/" + TrataVal(this.Ano_legc_zon)
                    }
                    else {
                        strLegislacao = ""
                    }
                    tableClassViaria += "{ ClassificacaoViaria: '" + TrataVal(this.Txt_dcr_claf_viar) + "', CodLog: '" + TrataVal(this.Nom_codlog) + "', Logradouro: '" + TrataVal(this.Txt_dcr_log.replace(/'/g, "\\'")) + "', Legislacao: '" + strLegislacao + "', Atualizacao: '" + TrataData(this.Dt_atlz_tab) + "', Status: '" + TrataVal(this.Status) + "' },";
                });
            }

            if (this.listaParametro != null) {
                lenParametro = this.listaParametro.length;
                jQuery.each((this.listaParametro), function (jsoni5) {
                    tableParametro += "{ Descricao: '" + this.Descricao + "', Valor: '" + this.Valor + "'},";
                });
            }

            if (this.listaQuota != null) {
                lenQuota = this.listaQuota.length;
                jQuery.each((this.listaQuota), function (jsoni6) {
                    tableQuota += "{ Descricao: '" + this.Descricao + "', Valor: '" + this.Valor + "'},";
                });
            }

            if (this.listaNotaParametro != null) {
                lenNotaParametro = this.listaNotaParametro.length;
                jQuery.each((this.listaNotaParametro), function (jsoni7) {
                    tableNotaParametro += "{ Zona: '" + this.Zona + "', Nota: '" + this.Nota + "'},";
                });
            }

            if (this.listaTPCL != null) {
                tpcl = this.listaTPCL.length;
                jQuery.each((this.listaTPCL), function (jsoni8) {
                    $('#lblIntegracao').html('SQL:' + this.Setor + '.' + this.Quadra + '.' + this.Lote + '-' + this.DigitoSQL);
                    $('#lblIntegracaoEndereco').html(this.NomeLogradouro + ',' + this.NrPorta);
                });
            }

            if (this.listaQuotaNota != null) {
                lenQuotaNota = this.listaQuotaNota.length;
                jQuery.each((this.listaQuotaNota), function (jsoni9) {
                    tableQuotaNota += "{ Nota: '" + this.Nota + "'},";
                });
            }

            //console.log(tableClassViaria);

        });



        //tableZoneamento = eval("[" + "{ Zona de Uso: 'ZEIS3         ', Descrição: 'ZONA ESPECIAL DE INTERESSE SOCIAL  3                                 ', Perímetro: '5017', Legislação: '138852004'}," + "]");
        tableZoneamento = eval("[" + tableZoneamento + "]");
        //tableClassViaria = eval("[" + "{ Classificação Viária: '1', CODLOG: '001678', Logradouro: '                                                            '}," + "]");
        tableClassViaria = eval("[" + tableClassViaria + "]");

        tableParametro = eval("[" + tableParametro + "]");
        tableNotaParametro = tableNotaParametro.replace(/\r?\n/g, "\\n");
        console.log(tableNotaParametro);
        tableNotaParametro = eval("[" + tableNotaParametro + "]");

        tableQuota = eval("[" + tableQuota + "]");

        tableQuotaNota = eval("[" + tableQuotaNota + "]");

        carregaGridIntegracaoSISZON(lenZoneamento, lenClassViaria, tableZoneamento, tableClassViaria, lenParametro, tableParametro, lenNotaParametro, tableNotaParametro, lenQuota, tableQuota, lenQuotaNota, tableQuotaNota);

        //versao anterior
        //jQuery.each((JsonIntegracao), function (jsoni2) {

        //jQuery.each((this), function (jsoni3) {

        //table += "{ feature: '" + "Zona de Uso" + "', valor: '" + this.Sgl_zona + "'},";
        //table += "{ feature: '" + "Descrição" + "', valor: '" + this.Txt_desc_zona + "'},";
        //table += "{ feature: '" + "Perímetro" + "', valor: '" + this.Cd_zon.substring(4, 8) + "'},";
        //table += "{ feature: '" + "Legislação" + "', valor: '" + this.Numero_legislacao + "/" + this.Ano_legislacao + "'},";

        //});
        //});

        //table = "[" + table + "]";
        //tablec = eval(table);
        //carregaGridIntegracao(4, tablec);
        //termina aqui versao anterior

    }

    if (tipo == 16) {
        $("#lnkVisualizarImpressao").show();
    }
    else {
        $("#lnkVisualizarImpressao").hide();
    }
}

VisualizarImpressao = function () {
    //window.open("Report/ConsultaZoneamento/ConsultaZoneamento.aspx?SQLzoneamento=" + $("#hdnSQLzoneamento").val(), "_blank", "menubar=1,resizable=1,width=1250,height=650,left=50,top=50");

    var printForm = document.createElement("form");
    printForm.target = "PrintZon";
    printForm.method = "POST"; // or "post" if appropriate
    printForm.action = "Report/ConsultaZoneamento/ConsultaZoneamento.aspx";

    var SQLInput = document.createElement("input");
    SQLInput.type = "text";
    SQLInput.name = "SQLzoneamento";
    SQLInput.value = $("#hdnSQLzoneamento").val();
    printForm.appendChild(SQLInput);

    var CPInput = document.createElement("input");
    CPInput.type = "text";
    CPInput.name = "cp";
    CPInput.value = $('#txtValorCaptcha').val();
    printForm.appendChild(CPInput);

    var strInput = document.createElement("input");
    strInput.type = "text";
    strInput.name = "str";
    strInput.value = $('#__strVal').val();
    printForm.appendChild(strInput);

    document.body.appendChild(printForm);

    print = window.open("", "PrintZon", "menubar=1,resizable=1,width=1250,height=650,left=50,top=50");

    if (print) {
        printForm.submit();
    } else {
        jAlert('É necessário permitir ao navegador a abertura de popups!', 'Mensagem', function () { });
    }

}

VisualizarImpressaoCIT = function () {    

    var printForm = document.createElement("form");
    printForm.target = "PrintCIT";
    printForm.method = "POST"; // or "post" if appropriate
    printForm.action = "Report/CertidaoCIT/CertidaoCIT.aspx";

    var TextoInput = document.createElement("input");
    TextoInput.type = "text";
    TextoInput.name = "textoCertidao";
    TextoInput.value = $("#hdnTextoCertidao").val();
    printForm.appendChild(TextoInput);

    var DataInput = document.createElement("input");
    DataInput.type = "text";
    DataInput.name = "dataCertidao";
    DataInput.value = $("#hdnDataCertidao").val();
    printForm.appendChild(DataInput);

    var CPInput = document.createElement("input");
    CPInput.type = "text";
    CPInput.name = "cp";
    CPInput.value = $('#txtValorCaptcha').val();
    printForm.appendChild(CPInput);

    var strInput = document.createElement("input");
    strInput.type = "text";
    strInput.name = "str";
    strInput.value = $('#__strVal').val();
    printForm.appendChild(strInput);

    document.body.appendChild(printForm);

    print = window.open("", "PrintCIT", "menubar=1,resizable=1,width=1250,height=650,left=50,top=50");

    if (print) {
        printForm.submit();
    } else {
        jAlert('É necessário permitir ao navegador a abertura de popups!', 'Mensagem', function () { });
    }
}

carregaGridIntegracaoSOF = function (lenOrgao, LenFuncao, tableOrgao, tableFuncao) {

    //Caso não tenha registros exibe mensagem de erro e sai da função
    if (lenOrgao == 0) {
        jAlert('Não há registros para a pesquisa efetuada.', 'Mensagem', function () { });
        closeloading();
        return false;
    } else {
        if (globalSubPrefeituraIntegracao !== "") {
            pesquisaSubPrefeituraIntegracao(globalSubPrefeituraIntegracao);
            globalSubPrefeituraIntegracao = "";
        }
    }


    //Prepara os elementos HTML para montagem do grid 
    var rnd = (Math.random()).toString().replace('.', '').substring(0, 5);
    var idT = 'T_' + rnd;
    var idP = 'P_' + rnd;
    var idPH = 'PH_' + rnd;
    var idM = 'M_' + rnd;
    var idH = 'H_' + rnd;

    var strHTMLhdr = "<table id=" + idH + "></table><br>";
    var strHTMLpgrh = "<div id=" + idPH + "></div>";
    var strHTMLtbl = "<table id=" + idT + "></table>";
    var strHTMLpgr = "<div id=" + idP + "></div>";
    jQuery('#gridDadosIntegracao').html(strHTMLhdr + strHTMLpgrh + strHTMLtbl + strHTMLpgr).css('text-align', '-webkit-center');
    var gridOrgao = jQuery('#' + idH);
    var gridFuncao = jQuery('#' + idT);


    //Função que instancia o componente jqGrid
    montaGridIntegracaoSOFOrgao = function () {

        gridOrgao.jqGrid({
            datatype: "local",
            data: tableOrgao,
            height: "auto",
            colNames: ["Orgão", "Valor Empenhado", "Valor Liquidado"],
            colModel: [{ name: 'Orgao', index: 'Orgao', width: '200', sortable: false, align: 'left' },
                       { name: 'ValorEmpenhado', index: 'ValorEmpenhado', width: '135', sortable: false, align: 'center' },
                       { name: 'ValorLiquidado', index: 'ValorLiquidado', width: '135', sortable: false, align: 'center' }],
            multiselect: false,
            caption: "Execução orçamentária por Órgão (Investimentos públicos)",
            pager: idP,
            rowNum: 5,
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

    montaGridIntegracaoSOFFuncao = function () {

        gridFuncao.jqGrid({
            datatype: "local",
            data: tableFuncao,
            height: "auto",
            colNames: ["Função", "Valor Empenhado", "Valor Liquidado"],
            colModel: [{ name: 'Funcao', index: 'Funcao', width: '200', sortable: false, align: 'left' },
                       { name: 'ValorEmpenhado', index: 'ValorEmpenhado', width: '135', sortable: false, align: 'center' },
                       { name: 'ValorLiquidado', index: 'ValorLiquidado', width: '135', sortable: false, align: 'center' }],
            multiselect: false,
            caption: "Execução orçamentária por Função Orçamentária (Investimentos públicos)",
            pager: idPH,
            rowNum: 5, //LenFuncao,
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

    //Chamada da função que monta e exibe o grid
    jQuery('#divJanelaDados').css('height', '435px');
    // jQuery('#divDadosIntegracao').css('height', '495px').show();
    montaGridIntegracaoSOFOrgao();
    montaGridIntegracaoSOFFuncao();
    $('#gridDadosIntegracao')[0].style.display = 'block';
    jQuery("div.ui-jqgrid-view").children("div.ui-jqgrid-titlebar").css("text-align", "center").children("span.ui-jqgrid-title").css("float", "none");
    closeloading();

}

/*********************************************************
Nome: converteFloatReal()
Objetivo: Converte Float em Reais
**********************************************************/
function converteFloatReal(valor) {
    var inteiro = null, decimal = null, c = null, j = null;
    var aux = new Array();
    valor = "" + valor;
    c = valor.indexOf(",", 0);
    //encontrou o ponto na string
    if (c > 0) {
        //separa as partes em inteiro e decimal
        inteiro = valor.substring(0, c);
        decimal = valor.substring(c + 1, valor.length);
    } else {
        inteiro = valor;
    }

    //pega a parte inteiro de 3 em 3 partes
    for (j = inteiro.length, c = 0; j > 0; j -= 3, c++) {
        aux[c] = inteiro.substring(j - 3, j);
    }

    //percorre a string acrescentando os pontos
    inteiro = "";
    for (c = aux.length - 1; c >= 0; c--) {
        inteiro += aux[c] + '.';
    }
    //retirando o ultimo ponto e finalizando a parte inteiro

    inteiro = inteiro.substring(0, inteiro.length - 1);

    decimal = parseInt(decimal);
    if (isNaN(decimal)) {
        decimal = "00";
    } else {
        decimal = "" + decimal;
        if (decimal.length === 1) {
            decimal = decimal + "0";
        }
    }


    valor = "R$ " + inteiro + "," + decimal;


    return valor;

}

var layerSubprefeituraSelect;
pesquisaSubPrefeituraIntegracao = function (pSubPrefeitura) {

    loading();

    //Reseta o mapa
    _limpaSelecao();

    //Montagem da string de filtro CQL
    var cqlFilter = "cd_identificador_subprefeitura = " + pSubPrefeitura;

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

    layerSubprefeituraSelect = new OpenLayers.Layer.Vector("Sub", {
        strategies: [new OpenLayers.Strategy.Fixed()],
        protocol: new OpenLayers.Protocol.HTTP(layerSubprefeituraSelect_wfs_options),
        styleMap: new OpenLayers.Style(OpenLayers.Feature.Vector.style["select"])
    });

    //Adicionando a camada
    map.addLayer(layerSubprefeituraSelect)


    layerSubprefeituraSelect.events.on(
        {
            "loadend": function (e) {
                if (e.object.features.length == 0) {
                    alert("Feição não localizada no mapa.");
                }
            }
        });


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
    });

}

/*********************************************************
Nome: TrataJsonIntegracaoSLC()
Objetivo: Trata o Json retornado do WebService e chama o carregamento do grid com as informações
Pri
**********************************************************/
function TrataJsonIntegracaoSLC(JsonIntegracao) {
    var table = "";
    var tableP = "";
    var tableF = "";
    var vSqls = "";

    $('#divSituacaoIntegracao')[0].style.display = 'none';
    $('#gridDadosIntegracao')[0].style.display = 'none';
    $('#gridDadosIntegracaoB')[0].style.display = 'none';
    $('#gridDadosIntegracaoC')[0].style.display = 'none';


    jQuery.each((JsonIntegracao), function (jsoni2) {
        //campos retirados em 12/09/2018, conforme solicitado pela Mariana por email
        table += "{ feature: '" + "Ano Alvará" + "', valor: '" + this.Alvara.Ano + "'},";
        table += "{ feature: '" + "Dt Emissão Alvará" + "', valor: '" + FormatarData(this.Alvara.DataEmissao) + "'},";
        // table += "{ feature: '" + "Dt Validade Alvará" + "', valor: '" + this.Alvara.DataValidade + "'},";
        table += "{ feature: '" + "Número Alvará" + "', valor: '" + this.Alvara.NumeroAlvara + "'},";

        vSqls = "";
        jQuery.each((this.SQLEnvolvidos), function (jsoni3) {
            vSqls += this.Numero + "/";
        });

        table += "{ feature: '" + "Sqls Envolvidos" + "', valor: '" + vSqls + "'},";

        //table += "{ feature: '" + "Motivo Indeferimento" + "', valor: '" + this.MotivoIndeferimento + "'},";
        table += "{ feature: '" + "Assunto" + "', valor: '" + this.NomeAssunto + "'},";
        table += "{ feature: '" + "Num. Processo" + "', valor: '" + this.NumeroProcesso + "'},";
        table += "{ feature: '" + "Situação" + "', valor: '" + this.Situacao + "'},";
        // table += "{ feature: '" + "Documento Alvará SLC-e" + "', valor: '<a href= ConsultaRelatorioAlvaraProcesso.aspx?q1 =" + this.Alvara.Ano + "&q2=" + this.Alvara.NumeroAlvara + "&q3=" + this.Alvara.SequenciaAlvara + " + 'Clique aqui para abrir </a>'},";
        table += "{ feature: '" + "Documento Alvará SLC-e" + "', valor: '<a href= ConsultaRelatorioAlvaraProcesso.aspx?q1=" + this.Alvara.NumeroAlvara + " target=_blank> Clique aqui para abrir</a>'},";

    });

    table = "[" + table + "]";
    tablec = eval(table);
    carregaGridIntegracaoSLC(8, tablec);


    $("#lnkVisualizarImpressao").hide();
    

}
/*********************************************************
Nome: TrataVal()
Objetivo: Trata valores nulos, true, false...
**********************************************************/
function TrataVal(valor) {

    if (valor == null) {
        return "";
    } else if (valor === "0") {
        return "0";
    } else if (valor === true) {
        return "Sim";
    } else if (valor === false) {
        return "Não";
    } else {
        //retira quebras de linha vinda em algumas requisições
        return valor.toString().replace(/\r?\n/g, " ");
    }

}

/*********************************************************
Nome: TrataData()
Objetivo: Trata datas.
**********************************************************/
function TrataData(data) {    
    data = data.toString();
    return data.substring(8, 10) + "/" + data.substring(5, 7) + "/" + data.substring(0, 4);
    }

/*********************************************************
Nome: carregaGridIntegracao()
Objetivo: Carrega o grid de integracao
**********************************************************/
carregaGridIntegracao = function (rowNumDinamic, table) {

    var cmbTipo = $('#cboSerieIntegracao').val();

    //Caso não tenha registros exibe mensagem de erro e sai da função
    if (table.length == 0) {
        jAlert('Não há registros para a pesquisa efetuada.', 'Mensagem', function () { });
        closeloading();
        return false;
    }

    arrLogs = table;

    //Prepara os elementos HTML para montagem do grid 
    var rnd = (Math.random()).toString().replace('.', '').substring(0, 5);
    var idT = 'T_' + rnd;
    var idP = 'P_' + rnd;
    var idM = 'M_' + rnd;

    var strHTMLtbl = "<table id=" + idT + "></table>";
    var strHTMLpgr = "<div id=" + idP + "></div>";
    jQuery('#gridDadosIntegracao').html(strHTMLtbl + strHTMLpgr).css('text-align', '-webkit-center');
    var grid = jQuery('#' + idT);


    //Função que instancia o componente jqGrid
    montaGridIntegracao = function () {

        if (cmbTipo == '11' /*TPCL*/) {
            _colNames = ["Atributo", "Valor"];
        } else {
            _colNames = ["Feature", "Valor"];
        }        

        grid.jqGrid({
            datatype: "local",
            data: arrLogs,
            height: "auto",
            colNames: _colNames,
            colModel: [{ name: 'feature', index: 'feature', width: '150', sortable: false },
                       { name: 'valor', index: 'valor', width: '305', title: false, sortable: false }],
            multiselect: false,
            caption: "",
            pager: idP,
            rowNum: rowNumDinamic,
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
    //Chamada da função que monta e exibe o grid

    jQuery('#divDadosIntegracao').show();
    $('#lblIntegracao').html('');
    $('#lblIntegracaoEndereco').html('');
    montaGridIntegracao();
    $('#gridDadosIntegracao')[0].style.display = 'block';

    closeloading();
}

carregaGridIntegracaoSLC = function (rowNumDinamic, table) {


    //Caso não tenha registros exibe mensagem de erro e sai da função
    if (table.length == 0) {
        jAlert('Não há registros para a pesquisa efetuada.', 'Mensagem', function () { });
        closeloading();
        return false;
    }

    arrLogs = table;

    //Prepara os elementos HTML para montagem do grid 
    var rnd = (Math.random()).toString().replace('.', '').substring(0, 5);
    var idT = 'T_' + rnd;
    var idP = 'P_' + rnd;
    var idM = 'M_' + rnd;

    var strHTMLtbl = "<table id=" + idT + "></table>";
    var strHTMLpgr = "<div id=" + idP + "></div>";
    jQuery('#gridDadosIntegracao').html(strHTMLtbl + strHTMLpgr).css('text-align', '-webkit-center');
    var grid = jQuery('#' + idT);


    //Função que instancia o componente jqGrid
    montaGridIntegracao = function () {

        _colNames = ["Feature", "Valor"];

        grid.jqGrid({
            datatype: "local",
            data: arrLogs,
            height: "auto",
            colNames: _colNames,
            colModel: [{ name: 'feature', index: 'feature', width: '150', sortable: false },
                       { name: 'valor', index: 'valor', width: '305', title: false, sortable: false }],
            multiselect: false,
            caption: "",
            pager: idP,
            rowNum: rowNumDinamic,
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
    //Chamada da função que monta e exibe o grid
    jQuery('#divDadosIntegracao').show();
    montaGridIntegracao();
    $('#gridDadosIntegracao')[0].style.display = 'block';

    closeloading();
}
/*********************************************************
Nome: carregaGridIntegracaoB()
Objetivo: Carrega o grid de integracaoB - utilizado na "Filiação"
**********************************************************/
carregaGridIntegracaoB = function (rowNumDinamic, table) {

    //Caso não tenha registros exibe mensagem de erro e sai da função
    if (table.length == 0) {
        jAlert('Não há registros para a pesquisa efetuada.', 'Mensagem', function () { });
        closeloading();
        return false;
    }

    arrLogs = table;

    //Prepara os elementos HTML para montagem do grid 
    var rnd = (Math.random()).toString().replace('.', '').substring(0, 5);
    var idT = 'T_' + rnd;
    var idP = 'P_' + rnd;
    var idM = 'M_' + rnd;

    var strHTMLtbl = "<table id=" + idT + "></table>";
    var strHTMLpgr = "<div id=" + idP + "></div>";
    jQuery('#gridDadosIntegracaoB').html(strHTMLtbl + strHTMLpgr);
    var grid = jQuery('#' + idT);


    //Função que instancia o componente jqGrid
    montaGridIntegracaoB = function () {

        grid.jqGrid({
            datatype: "local",
            data: arrLogs,
            height: "auto",
            colNames: ["Setor", "Quadra", "Lote"],
            colModel: [{ name: 'Setor', index: 'Setor', width: '50', sortable: false },
                       { name: 'Quadra', index: 'Quadra', width: '50', sortable: false },
                       { name: 'Lote', index: 'Lote', width: '110', title: false, sortable: false }],
            multiselect: false,
            caption: "",
            pager: idP,
            rowNum: rowNumDinamic,
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
    //Chamada da função que monta e exibe o grid
    jQuery('#divDadosIntegracao').show();
    montaGridIntegracaoB();
    $('#gridDadosIntegracaoB')[0].style.display = 'block';

    closeloading();

}

/*********************************************************
Nome: carregaGridIntegracaoC()
Objetivo: Carrega o grid de integracaoC - utilizado na "Filiação"
**********************************************************/
carregaGridIntegracaoC = function (rowNumDinamic, table) {

    //Caso não tenha registros exibe mensagem de erro e sai da função
    if (table.length == 0) {
        jAlert('Não há registros para o SQL Pai na pesquisa efetuada.', 'Mensagem', function () { });
        closeloading();
        return false;
    }

    arrLogs = table;

    //Prepara os elementos HTML para montagem do grid 
    var rnd = (Math.random()).toString().replace('.', '').substring(0, 5);
    var idT = 'T_' + rnd;
    var idP = 'P_' + rnd;
    var idM = 'M_' + rnd;

    var strHTMLtbl = "<table id=" + idT + "></table>";
    var strHTMLpgr = "<div id=" + idP + "></div>";
    jQuery('#gridDadosIntegracaoC').html(strHTMLtbl + strHTMLpgr);
    var grid = jQuery('#' + idT);


    //Função que instancia o componente jqGrid
    montaGridIntegracaoC = function () {

        grid.jqGrid({
            datatype: "local",
            data: arrLogs,
            height: "auto",
            colNames: ["Setor", "Quadra", "Lote"],
            colModel: [{ name: 'Setor', index: 'Setor', width: '50', sortable: false },
                       { name: 'Quadra', index: 'Quadra', width: '50', sortable: false },
                       { name: 'Lote', index: 'Lote', width: '110', title: false, sortable: false }],
            multiselect: false,
            caption: "",
            pager: idP,
            rowNum: rowNumDinamic,
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
    //Chamada da função que monta e exibe o grid
    jQuery('#divDadosIntegracao').show();
    montaGridIntegracaoC();
    $('#gridDadosIntegracaoC')[0].style.display = 'block';

    closeloading();
}

/*********************************************************
Nome: carregaGridIntegracaoCADLOG()
Objetivo: Carrega o grid de integracao - utilizado no "CADLOG"
**********************************************************/
carregaGridIntegracaoCADLOG = function (rowNumDinamic, table, dataHeader) {

    //Caso não tenha registros exibe mensagem de erro e sai da função
    if (table.length == 0) {
        jAlert('Não há registros para o SQL Filho na pesquisa efetuada.', 'Mensagem', function () { });
        closeloading();
        return false;
    }

    arrLogs = table;

    //Prepara os elementos HTML para montagem do grid 
    var rnd = (Math.random()).toString().replace('.', '').substring(0, 5);
    var idT = 'T_' + rnd;
    var idP = 'P_' + rnd;
    var idM = 'M_' + rnd;
    var idH = 'H_' + rnd;

    var strHTMLhdr = "<table id=" + idH + "><tr><th>CODLOG:</th><td><label>" + dataHeader.CodLog + "</label></td></tr><tr><th>Logradouro:</th><td><label>" + dataHeader.Logradouro + "</label></td></tr></table>";
    var strHTMLtbl = "<table id=" + idT + "></table>";
    var strHTMLpgr = "<div id=" + idP + "></div>";
    jQuery('#gridDadosIntegracao').html(strHTMLhdr + strHTMLtbl + strHTMLpgr).css('text-align', '-webkit-center');
    var grid = jQuery('#' + idT);

    /*Formatando Header*/
    jQuery('#' + idH).css('width', '85%');
    jQuery('#' + idH + ' th').css('text-align', 'left').css('color', '#728fab').css('font-size', '13px');
    jQuery('#' + idH + ' label').css('text-align', 'left').css('font-size', '13px');

    //Função que instancia o componente jqGrid
    montaGridIntegracaoCADLOG = function () {

        grid.jqGrid({
            datatype: "local",
            data: arrLogs,
            height: "auto",
            colNames: ["CEP", "Número Inicial", "Número Final"],
            colModel: [{ name: 'Cep', index: 'Cep', width: '200', sortable: false, align: 'center' },
                       { name: 'NumeroInicial', index: 'NumeroInicial', width: '100', sortable: false, align: 'center' },
                       { name: 'NumeroFinal', index: 'NumeroFinal', width: '100', title: false, sortable: false, align: 'center' }],
            multiselect: false,
            caption: "",
            pager: idP,
            rowNum: rowNumDinamic,
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
    //Chamada da função que monta e exibe o grid
    jQuery('#divDadosIntegracao').show();
    montaGridIntegracaoCADLOG();
    $('#gridDadosIntegracao')[0].style.display = 'block';

    closeloading();

}


/*********************************************************
Nome: carregaGridIntegracaoCADTEC()
Objetivo: Carrega o grid de integracao - utilizado no "CADTEC"
**********************************************************/
carregaGridIntegracaoCADTEC = function (lenAtual, lenAnterior, tableAtual, tableAnterior) {

    //Caso não tenha registros exibe mensagem de erro e sai da função
    if (tableAtual.length == 0) {
        jAlert('Não há registros para a pesquisa efetuada.', 'Mensagem', function () { });
        closeloading();
        return false;
    }


    //Prepara os elementos HTML para montagem do grid 
    var rnd = (Math.random()).toString().replace('.', '').substring(0, 5);
    var idT = 'T_' + rnd;
    var idP = 'P_' + rnd;
    var idPH = 'PH_' + rnd;
    var idM = 'M_' + rnd;
    var idH = 'H_' + rnd;

    var strHTMLhdr = "<table id=" + idH + "></table><br>";
    var strHTMLpgrh = "<div id=" + idPH + "></div>";
    var strHTMLtbl = "<table id=" + idT + "></table>";
    var strHTMLpgr = "<div id=" + idP + "></div>";
    jQuery('#gridDadosIntegracao').html(strHTMLhdr + strHTMLpgrh + strHTMLtbl + strHTMLpgr).css('text-align', '-webkit-center');
    var gridAtual = jQuery('#' + idH);
    var gridAnterior = jQuery('#' + idT);

    /*Formatando Header*/
    /*
    jQuery('#' + idH).css('width','85%');
    jQuery('#' + idH + ' th').css('text-align', 'left').css('color', '#728fab').css('font-size', '13px');
    jQuery('#' + idH + ' label').css('text-align', 'left').css('font-size', '13px');
    */

    //Função que instancia o componente jqGrid
    montaGridIntegracaoCADTECAtual = function () {

        gridAtual.jqGrid({
            datatype: "local",
            data: tableAtual,
            height: "auto",
            colNames: ["Denominação", "Origem"],
            colModel: [{ name: 'Denominacao', index: 'Denominacao', width: '300', sortable: false, align: 'center' },
                       { name: 'Origem', index: 'Origem', width: '100', title: false, sortable: false, align: 'center' }],
            multiselect: false,
            caption: "DENOMINAÇÃO ATUAL",
            pager: idP,
            rowNum: lenAtual,
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

    montaGridIntegracaoCADTECAnterior = function () {

        gridAnterior.jqGrid({
            datatype: "local",
            data: tableAnterior,
            height: "auto",
            colNames: ["Sequência", "Denominação", "Origem", "Data"],
            colModel: [{ name: 'Sequencia', index: 'Sequencia', width: '65', sortable: false, align: 'center' },
                       { name: 'Denominacao', index: 'Denominacao', width: '230', sortable: false, align: 'center' },
                       { name: 'Origem', index: 'Origem', width: '50', title: false, sortable: false, align: 'center' },
                       { name: 'Data', index: 'Data', width: '55', title: false, sortable: false, align: 'center' }],
            multiselect: false,
            caption: "DENOMINAÇÃO ANTERIOR",
            pager: idPH,
            rowNum: 10, //lenAnterior,
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

    //Chamada da função que monta e exibe o grid
    jQuery('#divJanelaDados').css('height', '435px');
    jQuery('#divDadosIntegracao').css('height', '495px').show();
    montaGridIntegracaoCADTECAtual();
    montaGridIntegracaoCADTECAnterior();
    $('#gridDadosIntegracao')[0].style.display = 'block';
    jQuery("div.ui-jqgrid-view").children("div.ui-jqgrid-titlebar").css("text-align", "center").children("span.ui-jqgrid-title").css("float", "none");
    closeloading();

}


/*********************************************************
Nome: carregaGridIntegracaoSIZSON()
Objetivo: Carrega o grid de integracao - utilizado no "SISZON"
**********************************************************/
carregaGridIntegracaoSISZON = function (lenZoneamento, lenClassViaria, tableZoneamento, tableClassViaria, lenParametro, tableParametro, lenNotaParametro, tableNotaParametro, lenQuota, tableQuota) {

    //Caso não tenha registros exibe mensagem de erro e sai da função
    if ((tableZoneamento.length == 0) && (tableClassViaria.length == 0)) {
        jAlert('Sua busca não retornou nenhum resultado. Verifique o número de contribuinte (SQL) do lote consultado ou procure o atendimento ao público da Secretaria Municipal de Urbanismo e Licenciamento sobre legislação urbanística. Mais informações, <a href="https://capital.sp.gov.br/web/licenciamento/w/servicos/295355" target="_blank">clique aqui</a>.', 'Mensagem', function () { });
        closeloading();
        RefreshCaptcha();
        return false;
    }

    //Caso uma das ocorrências de zoneamento seja 99, ou com perimetro indefinido para MA, PI, PA
    var perimetroMA = ['0001', '0002', '0003', '0004', '0005', '0006', '0007', '0008', '0009', '0010', '0011', '0012', '0013', '0014', '0015', '0016', '0017', '0018'];
    var perimetroPI = ['0001', '0002', '0003', '0004'];

    for (i in tableZoneamento) {
        if (
            (tableZoneamento[i].ZonaUso.trim() == '99') ||
            (tableZoneamento[i].ZonaUso.trim() == 'MA' && !(perimetroMA.indexOf(tableZoneamento[i].Perimetro) > -1)) ||
            (tableZoneamento[i].ZonaUso.trim() == 'PI' && !(perimetroPI.indexOf(tableZoneamento[i].Perimetro) > -1)) ||
            (tableZoneamento[i].ZonaUso.trim() == 'PA' && tableZoneamento[i].Perimetro == '0099')
            ) {
            jAlert('Para orientações sobre as indefinições no zoneamento apresentadas, comparecer ao atendimento ao público da Secretaria Municipal de Urbanismo e Licenciamento sobre legislação urbanística. Mais informações, <a href="http://www.prefeitura.sp.gov.br/cidade/secretarias/urbanismo/legislacao/zoneamento/index.php?p=238135" target="_blank">clique aqui</a>.', 'Mensagem', function () { });
        }
    }

    
    //Caso uma das ocorrências de zoneamento tenha legislação diferente de "L"
    for (i in tableZoneamento) {
        if (tableZoneamento[i].Legislacao.substring(0, 1) != 'L')
        {                               
            //console.log(tableZoneamento[i].Legislacao.substring(1, 1));
            tableParametro = "";
            //tableQuota = "";
            tableNotaParametro = "";
            //tableQuotaNota = "";
        }
    }


    //Prepara os elementos HTML para montagem do grid 
    var rnd = (Math.random()).toString().replace('.', '').substring(0, 5);
    var idT = 'T_' + rnd;            //QUOTA AMBIENTAL – QUADRO 3A DA LEI Nº 16.402/2016
    var idP = 'P_' + rnd;            //QUOTA AMBIENTAL – QUADRO 3A DA LEI Nº 16.402/2016

    var idH = 'H_' + rnd;            //ZONEAMENTO
    var idPH = 'PH_' + rnd;          //ZONEAMENTO

    var idPC = 'Q' + rnd;            //PARÂMETROS DE OCUPAÇÃO – QUADRO 3 DA LEI Nº 16.402/2016
    var idPCo = 'R' + rnd            //PARÂMETROS DE OCUPAÇÃO – QUADRO 3 DA LEI Nº 16.402/2016

    var idNotaP = 'NP_' + rnd;       //NOTAS - QUADRO 3 DA LEI Nº 16.402/2016
    var idNotaPB = 'NPB_' + rnd;     //NOTAS - QUADRO 3 DA LEI Nº 16.402/2016

    var idNotaQ = 'NQ_' + rnd;       //NOTAS - QUADRO 3A DA LEI Nº 16.402/2016	
    var idNotaQB = 'NPQ_' + rnd;     //NOTAS - QUADRO 3A DA LEI Nº 16.402/2016	

    var idC = 'C_' + rnd;             //HISTÓRICO DA CLASSIFICAÇÃO VIÁRIA
    var idCV = 'CV_' + rnd;           //HISTÓRICO DA CLASSIFICAÇÃO VIÁRIA

    var idM = 'M_' + rnd;

    var strHTMLhdr = "<table id=" + idH + "></table><br>";
    var strHTMLpgrh = "<div id=" + idPH + "></div>";

    var strHTMLtbl = "<table id=" + idT + "></table>";
    var strHTMLpgr = "<div id=" + idP + "></div>";

    var strHTMLtblA = "<table id=" + idPC + "></table>";
    var strHTMLpgrA = "<div id=" + idPCo + "></div>";

    var strHTMLtblB = "<table id=" + idNotaP + "></table>";
    var strHTMLpgrB = "<div id=" + idNotaPB + "></div>";

    var strHTMLtblQ = "<table id=" + idNotaQ + "></table>";
    var strHTMLpgrQ = "<div id=" + idNotaQB + "></div>";

    var strHTMLtblC = "<table id=" + idC + "></table>";
    var strHTMLpgrC = "<div id=" + idCV + "></div>";

    var siteA = "<a target=_blank href='http://gestaourbana.prefeitura.sp.gov.br/wp-content/uploads/2016/03/005-QUADRO_3_FINAL.pdf'>";
    var siteB = "<a target=_blank href='http://gestaourbana.prefeitura.sp.gov.br/wp-content/uploads/2016/03/006-QUADRO_3A_FINAL.pdf'>";
    var siteC = "<a target=_blank href='http://gestaourbana.prefeitura.sp.gov.br/marco-regulatorio/zoneamento/arquivos/'>";
    var siteD = "<a target=_blank href='https://capital.sp.gov.br/web/licenciamento/desenvolvimento_urbano/participacao_social/conselhos_e_orgaos_colegiados/ctlu'>";
    var siteE = "<a target=_blank href='http://legislacao.prefeitura.sp.gov.br/'>";
    var siteF = "<a target=_blank href='http://www3.prefeitura.sp.gov.br/cit/Forms/frmPesquisaGeral.aspx'>";
    var siteG = "<a target=_blank href='http://gestaourbana.prefeitura.sp.gov.br/marco-regulatorio/plano-diretor/arquivos/'>";

    var divParametro = "<div id=DivParametro style=text-align:left;>NA= Não se Aplica <br></div><br>";
    var divQuota = "<div id=divQuota style=text-align:left;>NA= Não se Aplica <br></div><br>";
    var divMensagem = "<div id=divMensagem style=text-align:left;>Para as espécies normativas diferentes de 'L 18.177/2024' efetuar consultas nos links correspondentes, conforme a legenda abaixo:</br>R = Resolução CTLU</br>DE = Despacho CTLU</br>PR = Pronunciamento CTLU</br>D = Decreto Municipal</br>AD - Ação Direta de Inconstitucionalidade</br></br>Links úteis</br></br>Câmara Técnica de Legislação Urbana – CTLU:</br>" + siteD + "https://capital.sp.gov.br/web/licenciamento/desenvolvimento_urbano/participacao_social/</br>/conselhos_e_orgaos_colegiados/ctlu</a></br></br>Legislação Municipal:</br>" + siteE + "http://legislacao.prefeitura.sp.gov.br</a></br></br>Para lotes fiscais em ZEPEC também consultar o CIT - Cadastro de Imóveis Tombados:</br>" + siteF + "http://www3.prefeitura.sp.gov.br/cit/Forms/frmPesquisaGeral.aspx</a></br></br>";
    var divDemaisQuadros = "<div id=divDemaisQuadros style=text-align:left;><hr><br>Para verificar os demais quadros da Lei nº 16.402/16, acesse:                                                                                                                                                       </br>" + siteC  + "http://gestaourbana.prefeitura.sp.gov.br/marco-regulatorio/zoneamento/arquivos/                                                        </a></br>Quadro 2 – Percentuais de destinação de área pública<br>Quadro 2A – Parâmetros  de Parcelamento do Solo (dimensões de lote) por zona<br>Quadro 2B – Parâmetros de Parcelamento do Solo (sistema viário)<br>Quadro 4 – Usos Permitidos por Zona<br>Quadro 4A – Condições de instalação por subcategoria de uso, grupos de atividade e usos específicos<br>Quadro 4B – Parâmetros de Incomodidade por zona</div><br>";
    var divClassViaria = "<div id=divMensagem2 style=text-align:left;>Para verificar o quadro da Lei 16.050/14, acesse: </br>" + siteG + "Quadro 9 –Viário Estrutural</a></div><br>";

    //jQuery('#gridDadosIntegracao').html(strHTMLhdr + strHTMLpgrh + divMensagem + strHTMLtblA + strHTMLpgrA + "</br>" + strHTMLtblB + strHTMLpgrB + divParametro + strHTMLtbl + strHTMLpgr + "</br>" + strHTMLtblQ + strHTMLpgrQ + divQuota + divDemaisQuadros).css('text-align', '-webkit-center');

    jQuery('#gridDadosIntegracao').html(strHTMLhdr + strHTMLpgrh + divMensagem + strHTMLtblA + strHTMLpgrA + "</br>" + strHTMLtblB + strHTMLpgrB + divParametro + strHTMLtbl + strHTMLpgr + "</br>" + strHTMLtblQ + strHTMLpgrQ + divQuota + strHTMLtblC + strHTMLpgrC + "</br>" + divDemaisQuadros + divClassViaria).css('text-align', '-webkit-center');


    //jQuery('#gridDadosIntegracaoB').html(strHTMLhdr + strHTMLpgrh + strHTMLtbl + strHTMLpgr).css('text-align', '-webkit-center');
    var gridZoneamento = jQuery('#' + idH);
    var gridClassViaria = jQuery('#' + idC);
    var gridParametro = jQuery('#' + idPC);
    var gridQuota = jQuery('#' + idT);
    var gridNotaParametro = jQuery('#' + idNotaP);
    var gridQuotaNota = jQuery('#' + idNotaQ);

    /*Formatando Header*/
    /*
    jQuery('#' + idH).css('width','85%');
    jQuery('#' + idH + ' th').css('text-align', 'left').css('color', '#728fab').css('font-size', '13px');
    jQuery('#' + idH + ' label').css('text-align', 'left').css('font-size', '13px');
    */

    //Função que instancia o componente jqGrid
    montaGridIntegracaoSISZONZoneamento = function () {

        gridZoneamento.jqGrid({
            datatype: "local",
            data: tableZoneamento,
            height: "100%",
            colNames: ["Sigla", "Descrição", "Perímetro", "Legislação"],
            colModel: [{ name: 'ZonaUso', index: 'ZonaUso', width: '100', sortable: false, align: 'center' },
                       { name: 'Descricao', index: 'Descricao', width: '250', title: false, sortable: false, align: 'center' },
                       { name: 'Perimetro', index: 'Perimetro', width: '92', title: false, sortable: false, align: 'center' },
                       { name: 'Legislacao', index: 'Legislacao', width: '120', title: false, sortable: false, align: 'center' }],
            multiselect: false,
            caption: "ZONEAMENTO",
            pager: idP,
            rowNum: 5,
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

    montaGridIntegracaoSISZONClassViaria = function () {

        gridClassViaria.jqGrid({
            datatype: "local",
            data: tableClassViaria,
            height: "100%",
            colNames: ["Classificação", "CodLog", "Logradouro", "Legislação", "Atualização", "Status"],
            colModel: [{ name: 'ClassificacaoViaria', index: 'ClassificacaoViaria', width: '100', sortable: false, align: 'center' },
                       { name: 'CodLog', index: 'CodLog', width: '50', sortable: false, align: 'center' },
                       { name: 'Logradouro', index: 'Logradouro', width: '180', title: false, sortable: false, align: 'center' },
                       { name: 'Legislacao', index: 'Legislacao', width: '80', sortable: false, align: 'center' },            
                       { name: 'Atualizacao', index: 'Atualizacao', width: '70', sortable: false, align: 'center' },
                       { name: 'Status', index: 'Status', width: '70', sortable: false, align: 'center' }],            
            multiselect: false,
            caption: "CLASSIFICAÇÃO VIÁRIA",
            pager: idCV,
            rowNum: 5,
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

    montaGridIntegracaoSISZONParametro = function () {

        gridParametro.jqGrid({
            datatype: "local",
            data: tableParametro,
            height: "100%",
            colModel: [{ name: 'Descricao', index: 'Descricao', width: '460', sortable: false, align: 'left' },
                       { name: 'Valor', index: 'Valor', width: '110', title: false, sortable: false, align: 'center' }],
            multiselect: false,
            caption: "PARÂMETROS DE OCUPAÇÃO – QUADRO 3 DA LEI Nº 16.402/2016",
            pager: idPCo,
            rowNum: 11,
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

    montaGridIntegracaoSISZONNotaParametro = function () {

        gridNotaParametro.jqGrid({
            datatype: "local",
            data: tableNotaParametro,
            height: "100%",
            colModel: [{ name: 'Zona', index: 'Zona', width: '110', sortable: false, align: 'center' },
                        { name: 'Nota', index: 'Nota', width: '460', title: false, sortable: false, align: 'left' }],
            multiselect: false,
            caption: "NOTAS - QUADRO 3 DA LEI Nº 16.402/2016 (ALTERADO PELA LEI N°18.081/2024)",
            pager: idNotaPB,
            rowNum: 10,
            //rowList: [10, 20, 30],
            localReader: { repeatitems: true },
            viewrecords: false,
            gridview: true,
            autowidth: false,
            ignoreCase: true,
            loadonce: false,
            hoverrows: false,
            loadError: function (xhr, st, err) {
                console.log("Type: " + st + "; Response: " + xhr.status + " " + xhr.statusText);
            },
            loadComplete: function () {
                //console.log(this);
                closeloading();
            }
        });
    }

    montaGridIntegracaoSISZONQuotaNota = function () {

        gridQuotaNota.jqGrid({
            datatype: "local",
            data: tableQuotaNota,
            height: "100%",
            colModel: [
                       { name: 'Nota', index: 'Nota', width: '575', title: false, sortable: false, align: 'left' }],
            multiselect: false,
            caption: "NOTAS - QUADRO 3A DA LEI Nº 16.402/2016",
            pager: idNotaQB,
            rowNum: 1,
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

    montaGridIntegracaoSISZONQuota = function () {

        gridQuota.jqGrid({
            datatype: "local",
            data: tableQuota,
            height: "100%",
            colModel: [{ name: 'Descricao', index: 'Descricao', width: '460', sortable: false, align: 'left' },
                       { name: 'Valor', index: 'Valor', width: '120', title: false, sortable: false, align: 'center' }],
            multiselect: false,
            caption: "QUOTA AMBIENTAL – QUADRO 3A DA LEI Nº 16.402/2016",
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
    //Chamada da função que monta e exibe o grid
    jQuery('#divJanelaDados').css('height', '435px');
    jQuery('#divDadosIntegracao').css('height', '495px').show();
    montaGridIntegracaoSISZONZoneamento();
    //a apresentacao das informacoes de classificacao viaria ficara desabilitada temporariamente confome solicitacao do cliente
    //para apresentar novamente favor habilitar a linha abaixo
    montaGridIntegracaoSISZONClassViaria();
    //devera ser habilitada tambem a adicao da listaClassViaria em ListaLocalidadeDO
    $('#gridDadosIntegracao')[0].style.display = 'block';
    jQuery("div.ui-jqgrid-view").children("div.ui-jqgrid-titlebar").css("text-align", "center").children("span.ui-jqgrid-title").css("float", "none");
    montaGridIntegracaoSISZONParametro();
    montaGridIntegracaoSISZONNotaParametro();
    montaGridIntegracaoSISZONQuota();
    montaGridIntegracaoSISZONQuotaNota();

    closeloading();
}

/*********************************************************
Nome: carregaGridIntegracaoCIT()
Objetivo: Carrega o grid de integracao CIT
**********************************************************/
carregaGridIntegracaoCIT = function (rowNumDinamic, table, descricaoCertidao, sql, dataConsulta, indicativoCertidao, codigoMensagem) {

    //Caso não tenha registros exibe mensagem de erro e sai da função
    if (codigoMensagem == 'NOK') {
        jAlert('Não há registros para a pesquisa efetuada.', 'Mensagem', function () { });
        closeloading();
        RefreshCaptcha();
        return false;
    }

    arrLogs = table;

    //Prepara os elementos HTML para montagem do grid 
    var rnd = (Math.random()).toString().replace('.', '').substring(0, 5);
    var idT = 'T_' + rnd;
    var idP = 'P_' + rnd;
    var idM = 'M_' + rnd;

    var strHTMLtbl = "<table id=" + idT + "></table>";
    var strHTMLpgr = "<div id=" + idP + "></div>";
    jQuery('#gridDadosIntegracaoCIT').html(strHTMLtbl + strHTMLpgr).css('text-align', '-webkit-center');
    var grid = jQuery('#' + idT);

    //Função que instancia o componente jqGrid
    montaGridIntegracaoCIT = function () {

        _colNames = ["Atributo", "Valor"];
       
        grid.jqGrid({
            datatype: "local",
            data: arrLogs,
            height: "auto",
            colNames: _colNames,
            colModel: [{ name: 'feature', index: 'feature', width: '150', sortable: false },
                       { name: 'valor', index: 'valor', width: '305', title: false, sortable: false }],
            multiselect: false,
            caption: "",
            pager: idP,
            rowNum: rowNumDinamic,
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

    jQuery('#divNotaExplicativa').html("\
        <table> \
            <tr> \
                <td> \
                    APT: Abertura de processo de tombamento \
                </td> \
            </tr> \
            <tr> \
                <td> \
                    T ou TOMB: Tombamento \
                </td> \
            </tr> \
            <tr> \
                <td> \
                    TEO: Tombamento ex-officio (indicando o tombamento feito a partir dos estudos elaborados pelo Condephaat e/ou IPHAN, adotando-se as mesmas diretrizes, ou seja, indicam imóveis já tombados anteriormente pelo Estado ou pela União) \
                </td> \
            </tr> \
            <tr> \
                <td> \
                    A.E.: Área Envoltória (indicando que o imóvel é integrante da área envoltória de um bem tombado) \
                </td> \
            </tr> \
            <tr> \
                <td> \
                    A: Tombamento ambiental (indicando os imóveis para os quais não há restrição específica para a edificação, estando preservado o ambiente externo, a saber: vegetação e áreas permeáveis, limites dos lotes e arruamentos) \
                </td> \
            </tr> \
            <tr> \
                <td> \
                    RAE: Regulamentação de Área Envoltória \
                </td> \
            </tr> \
            <tr> \
                <td> \
                    RES. Nº (composto por dois dígitos)/Ano (composto por dois dígitos): indicando o número da Resolução do CONPRESP que introduziu restrições de tombamento na instância municipal (ex: RES. 42/92 - Tombamento, pelo Conpresp, dos bairros de Pacaembu e Perdizes - referente à RES. SC 08/91 do Condephaat) \
                </td> \
            </tr> \
            <tr> \
                <td> \
                    RES. SC Nº (até 3 dígitos)/Ano (composto por dois dígitos): indicando número da Resolução do Condephaat que introduziu restrições de tombamento na instância estadual (ex: RES. SC 34/92 - Tombamento, pelo Condephaat, da Sociedade Harmonia de Tênis) \
                </td> \
            </tr> \
         <table> \
    ");

    //Chamada da função que monta e exibe o grid
    jQuery('#divDadosIntegracaoCIT').show();   
    montaGridIntegracaoCIT();
    $('#gridDadosIntegracaoCIT')[0].style.display = 'block';
    jQuery('#divNotaExplicativa').show();

    if (indicativoCertidao == "S") {
        jQuery('#divTextAdicional').hide();
    } else {
        jQuery('#divTextoAdicional').html('<p>' + descricaoCertidao + '</p>');
        jQuery('#divTextoAdicional').show();
    }

    closeloading();
}







/*********************************************************
Nome: _exibeDivZoomEscala()
Objetivo: Exibe um combo para seleção do zoom por escala
**********************************************************/
_exibeDivZoomEscala = function () {
    /*
    //var arrEscalas = map.resolutions.map(function (resolucao) { return "1 : " + parseInt(OpenLayers.Util.getScaleFromResolution(resolucao, 'm')) });
    var arrEscalas = new Array();

    for (var i = 0; i < map.resolutions.length; i++) {
    //arrEscalas[i] = '1 : ' + parseInt(OpenLayers.Util.getScaleFromResolution(map.resolutions[i], 'm'));
    //POG - Arredondamento das escalas apenas na visualização do combo
    arrEscalas[i] = '1 : ' + (Math.round(parseInt(OpenLayers.Util.getScaleFromResolution(map.resolutions[i], 'm')) / 10) * 10);
    }


    var controleZoomEscala = map.controls[0].controls[7];
    var strHtmlCombo = '<select id=cboEscala onchange=Javascript:mudaEscala(this.value) style="width: 105px">';
    for (var i = 0; i < arrEscalas.length; i++) {
    strHtmlCombo += '<option value=' + i + '>' + arrEscalas[i] + '</option>';
    }
    strHtmlCombo += '</select>';
    var strHtmlLabel = '<label>Escala:</label><br>';
    var strHtmlPopup = '<div id=divEscala>' + strHtmlLabel + strHtmlCombo + '</div>';   

    document.getElementById("divEscalaInside").innerHTML = strHtmlLabel + strHtmlCombo;
    */
    var strHtmlCampo = '<input type="text" id="txtEscala" style="width: 105px" class="" maxlength="6">';
    var strHtmlLabel = '<label>Escala:</label><br>';
    var strHtmlPopup = '<div id=divEscala>' + strHtmlLabel + strHtmlCampo + '</div>';

    document.getElementById("divEscalaInside").innerHTML = strHtmlPopup;

    map.fractionalZoom = true;

    document.getElementById('txtEscala').value = Math.round(map.getScale());

    $('#txtEscala').keyup(function (e) {
        //console.log(e.which);
        if (e.which == 13)
            mudaEscala(this.value);
    });

}


/*********************************************************
Nome: _exibeNorte()
Objetivo: Exibe uma imagem apontando para o norte
**********************************************************/
_exibeNorte = function () {
    document.getElementById("divImgNorte").innerHTML = "<img src='../css/img/seta-pequeno.png' />";
}



/*********************************************************
Nome: _abreFormPesquisaLogradouro()
Objetivo: Mostra DIV de Pesquisa de Logradouro
Disparador(es): ctlBtnPesquisaLogradouro
**********************************************************/
_abreFormPesquisaLogradouro = function () {
    showDiv(0);
}


/*********************************************************
Nome: _abreFormCoordenadas()
Objetivo: Mostra DIV de Pesquisa e Captura de Coordenadas
Disparador(es): ctlBtnPesquisaLogradouro
**********************************************************/
_abreFormCoordenadas = function () {
    showDivCoord(true);
}


/*********************************************************
Nome: _abreFormPDF()
Objetivo: Mostra DIV de escolha por setor ou quadra viária para consulta de PDF
Disparador(es): ctlBtnPDFSetor
**********************************************************/
_abreFormPDF = function () {
    //So executa se o obter informações estiver habilitado
    if (habilitaPDF == true) {
        showPDF();
    }
}



/*********************************************************
Nome: _controlaLayers()
Objetivo: Exibe ou esconde o Layers Switch
Disparador(es): ctlBtnShowLayers
**********************************************************/
_controlaLayers = function () {
    showLayers();
}

/*********************************************************
Nome: _showSelecao()
Objetivo: Exibe ou esconde a tela de tipo de seleção
Disparador(es): ctlBtnSelecao
**********************************************************/
_showSelecao = function () {
    if (habilitaSelecao == true) {
        showSelecao(); //chama o showSelecao da pagina aspx
    }
}

/*********************************************************
Nome: _showInfo()
Objetivo: Exibe ou esconde a pesquisa de informações
Disparador(es): ctlBtnShowinfo
**********************************************************/
_showInfo = function () {
    showInfo(0); //chama o showInfo da pagina aspx
}

/*********************************************************
Nome: _showCroqui()
Objetivo: Exibe ou esconde a visualização de croqui por Setor e quadra
Disparador(es): ctlBtnShowCroqui
**********************************************************/
_showCroqui = function () {
    showCroqui(0); //chama o showCroqui da pagina aspx

}

/*********************************************************
Nome: _showAjuda()
Objetivo: Exibe ou esconde a visualização de croqui por Setor e quadra
Disparador(es): ctlBtnShowCroqui
**********************************************************/
_showAjuda = function () {
    exibeLegenda();
    globalctlBtnShowLayers.trigger();
}



/*********************************************************
Nome: _showConfig()
Objetivo: Abre DIV de configuração
Disparador(es): ctlBtnConfig
**********************************************************/
_showConfig = function () {
    showConfig();
}

/*********************************************************
Nome: _showContato()
Objetivo: Abre DIV de contato
Disparador(es): ctlBtnContato
**********************************************************/
_showContato = function () {
    showContato();
}

/*********************************************************
Nome: exibeLegenda()
Objetivo: Exibe no mapa a foto de satélite
Parâmetro(s): bool - variável booleana para exibição ou não do popup de legenda
Disparador(es): init();_abreFormPesquisaLogradouro();baixarArquivos();carregaGridLogradouro()
**********************************************************/

exibeLegenda = function () {
    var bool = true;
    if (bool) {
        jQuery('#divLegenda', window.parent.document).show();
        parent.abrePopup();
        //jQuery(this, window.top).trigger('abrePopup');
    }
    else {
        jQuery('#divLegenda', window.parent.document).hide();
    }
}


/*********************************************************
Nome: exibeMsgGenerica()
Objetivo: Exibe mensagem no carregamento da pagina
Parâmetro(s): bool - variável booleana para exibição ou não da mensagem generica
Disparador(es): init()
**********************************************************/

exibeMsgGenerica = function (bool) {
    //var bool = true;
    if (bool) {
        jQuery('#divMsgGenerica', window.parent.document).show();
        parent.abrePopupMsgGenerica();
        //jQuery(this, window.top).trigger('abrePopup');
    }
    else {
        jQuery('#divMsgGenerica', window.parent.document).hide();
    }
}



/*********************************************************
Nome: exibeQuestionario()
Objetivo: Exibe questionário na abertura da página
Parâmetro(s): bool - variável booleana para exibição ou não do popup
Disparador(es): abertura da página
**********************************************************/

exibeQuestionario = function (bool) {
    if (bool) {
        document.getElementById('divQuestionario').style.display = "block";
        document.getElementById('divQuestionarioBGModal').style.display = "block";
    } else {
        document.getElementById('divQuestionario').style.display = "none";
        document.getElementById('divQuestionarioBGModal').style.display = "none";
    }
}

/*********************************************************
Nome: _ativaBuscaLonLat()
Objetivo: Ativa ou desativa o controle que captura o lonLat
Disparador(es): ctlBtnExibeInfo
**********************************************************/
_ativaBuscaLonLat = function (bool) {
    //So executa se o obter informações estiver habilitado
    if (habilitaInfo == true) {
        if (globalctlPegaLatLon.active == true) {
            globalctlPegaLatLon.deactivate();
            $('div.olLayerDiv').css('cursor', 'default')
        } else {
            globalctlPegaLatLon.activate();
            $('div.olLayerDiv').css('cursor', 'crosshair')
        }
    }

}


setaCamposPesquisa = function () {

    //Máscara dos campos

    $('#txtSetorPesquisa').mask("999", { placeholder: '0' });
    $('#txtSetorPesquisa').blur(function () { if (this.value == '000') this.value = ""; });

    $('#txtSetorLote').mask("999", { placeholder: '0' });
    $('#txtSetorLote').blur(function () { if (this.value == '000') this.value = ""; });

    $('#txtQuadraLote').mask("999", { placeholder: '0' });
    $('#txtQuadraLote').blur(function () { if (this.value == '000') this.value = ""; });

    $('#txtLote').mask("9999", { placeholder: '0' });
    $('#txtLote').blur(function () { if (this.value == '0000') this.value = ""; });
    $('#txtLote').keydown(function (e) {
        var keyCode = e.keyCode || e.which;
        if (keyCode != 9) {
            $('#txtCondominioLote').val('');
        }
    });

    $('#txtCondominioLote').mask("99", { placeholder: '0' });
    $('#txtCondominioLote').blur(function () { if (this.value == '00') this.value = ""; });
    $('#txtCondominioLote').keydown(function (e) {
        var keyCode = e.keyCode || e.which;
        if (keyCode != 9) {
            $('#txtLote').val('');
            $('#cboTipoLote').val('');
        }
    });

    $('#txtVisuSetor').mask("999", { placeholder: '0' });
    $('#txtVisuSetor').blur(function () { if (this.value == '000') this.value = ""; });

    $('#txtVisuQuadra').mask("999", { placeholder: '0' });
    $('#txtVisuQuadra').blur(function () { if (this.value == '000') this.value = ""; });

    $('#txtAreaAreaPublica').mask("999999", { placeholder: '0' });
    $('#txtAreaAreaPublica').blur(function () { if (this.value == '000000') this.value = ""; });
    $('#txtAreaAreaPublica').keydown(function (e) {
        var keyCode = e.keyCode || e.which;
        if (keyCode != 9) {
            $('#txtCroquiLoteamento').val('');
            $('#txtAreaCedida').val('');
        }
    });


    $('#txtCroquiLoteamento').keydown(function (e) {
        var keyCode = e.keyCode || e.which;
        if (keyCode != 9) {
            $('#txtAreaCedida').val('');
            $('#txtAreaAreaPublica').val('');
        }
    });

    $('#txtAreaCedida').keydown(function (e) {
        var keyCode = e.keyCode || e.which;
        if (keyCode != 9) {
            $('#txtCroquiLoteamento').val('');
            $('#txtAreaAreaPublica').val('');
        }
    });

    $('#txtNumeroLogLote').mask("?999999", { placeholder: '' });
    $('#txtNumeroLogLote').blur(function () { if (this.value == '000000') this.value = ""; $('#txtNumeroLogLote').mask("?999999", { placeholder: '' }); });
    $('#numero').mask("?999999", { placeholder: '' });
    $('#numero').blur(function () { if (this.value == '000000') this.value = ""; });



    //máscara integração
    $('#TxtIntSetor').mask("999", { placeholder: '0' });
    $('#TxtIntSetor').blur(function () { if (this.value == '000') this.value = ""; });

    $('#TxtIntQuadra').mask("999", { placeholder: '0' });
    $('#TxtIntQuadra').blur(function () { if (this.value == '000') this.value = ""; });

    $('#TxtIntLote').mask("9999", { placeholder: '0' });
    $('#TxtIntLote').blur(function () { if (this.value == '0000') this.value = ""; });
    //TxtIntCep


    //envio de email

    //$("#txtTelefoneContato").mask("(99) 99999-999?9");

    $('#txtTelefoneContato').on({
        focus: function (e) {
            if (typeof (e.originalEvent) != 'undefined') {
                var $el = $(this).val($(this).val().replace(/[^0-9]/g, ''));
                $el.focus();
            }
        },

        keyup: function (e) {
            if (((e.which < 48 || e.which > 57) && (e.which < 96 || e.which > 105)) && $(this).val().match(/[^0-9]/)) {
                $(this).val($(this).val().replace(/[^0-9]/g, ''));
            }
        },

        blur: function () {
            var limpo = $(this).val().replace(/[^0-9]/g, '');

            if (limpo.length == 8 || limpo.length == 9) {
                alert('Informe o DDD');
                return;
            }

            if (limpo.length == 10 || limpo.length == 11) {
                $(this).val('(' + limpo.substr(0, 2) + ') ' + limpo.substr(2, limpo.length == 10 ? 4 : 5) + '-' + limpo.substr(limpo.length == 10 ? 6 : 7, 10));
            }
        }
    });
}





function validaCamposContato() {
    var nomeRem = $("#txtNomeContato").val();
    var emailRem = $("#txtEmailContato").val();
    var foneRem = $("#txtTelefoneContato").val();
    var corpo = $("#txtMsgContato").val();


    if (nomeRem == "") {
        jAlert('O nome deve estar preenchido', 'Mensagem');
    } else {
        if (emailRem == "" || validateEmail(emailRem) == false) {
            jAlert('O e-mail deve estar preenchido e deve ser válido', 'Mensagem');
        } else {
            if (corpo == "") {
                jAlert('O corpo da mensagem deve estar preenchido', 'Mensagem');
            } else {
                //*********************************************
                PageMethods.EnviarEmail(nomeRem, emailRem, foneRem, corpo, onSuccessEnviaMail, onErrorEnviaMail);

                //jAlert('Mensagem enviada com sucesso', 'Mensagem', function () {
                jAlert('Sua mensagem foi enviada com sucesso.', 'Mensagem', function () {
                    limpaCamposContato();
                    inativaContato();
                });
            }
        }

    }

}

/*********************************************************
Nome: onSuccessEnviaMail()
Objetivo: Captura o retorno de sucesso no envio de email
Parâmetro(s): result - objeto de retorno do método
Disparador(es): callback de sucesso da função validaCamposContato()
*********************************************************/
onSuccessEnviaMail = function (result) {

    if (result.indexOf('NOK') != -1) {
        jAlert('Erro no envio da mensagem. Por favor tente novamente.\n' + result, 'Mensagem');
    }

}

/*********************************************************
Nome: onErrorEnviaMail()
Objetivo: Captura o retorno de erro e exibe no console
Disparador(es): callback de erro da função validaCamposContato()
*********************************************************/
onErrorEnviaMail = function (desc, b, c) {
    console.log(desc);
    console.log(b);
    console.log(c);
    jAlert('Erro no envio da mensagem. Por favor tente novamente.', 'Mensagem');
}

function validateEmail(email) {
    var emailReg = /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/;
    if (!emailReg.test(email)) {
        return false;
    } else {
        return true;
    }
}

function limpaCamposContato() {
    document.getElementById("txtNomeContato").value = ""
    document.getElementById("txtEmailContato").value = ""
    document.getElementById("txtTelefoneContato").value = ""
    document.getElementById("txtMsgContato").value = ""
}


/*********************************************************
Nome: validaCamposQuestionario()
Objetivo: valida os campos do questionário de entrada e grava no banco
Disparador(es): Radio button do questionário
*********************************************************/
function validaCamposQuestionario(radiobutton) {

    /*PageMethods.MostraIP(onSuccessMostraIP, onErrorMostraIP);*/


    var _hc = jQuery('#hc', window.parent.document).val();
    PageMethods.gravaQuestionario(_hc, radiobutton.value, onSuccessGravaQuestionario, onErrorGravaQuestionario);
    exibeQuestionario(false);
}

onSuccessGravaQuestionario = function (desc) {
    console.log(desc);
}
onErrorGravaQuestionario = function (desc) {
    console.log(desc);
    jAlert('Erro ao gravar questionário do usuário', 'Mensagem');
}


capturaCoordenadas = function () {
    globalctlPegaLatLonCoord.activate();
    document.getElementById('divCoord').style.display = "none";
    $('div.olLayerDiv').css('cursor', 'crosshair');
}

SelecionaQuadricula = function () {

    if ($('#cboTipoMapaArticulado').val() == '0') {
        jAlert('Selecione um tipo para download.', 'Mensagem', function () { });
    }
    else {

        if ($('#txtQuadricula').val() != '') {

            var _camada = arrCamadas[$("#cboTipoMapaArticulado").val()];
            var arrLevantamentos = _camada.Levantamentos;

            var _cd_quadricula = $('#txtQuadricula').val();
            var _cd_levantamento = arrLevantamentos;
            var _camada = arrCamadas[$("#cboTipoMapaArticulado").val()];
            var _nm_pasta = _camada.Pasta;
            var _padrao_arquivo = _camada.PadraoArquivo;
            var _nm_arquivo = _padrao_arquivo.replace('$$$', _cd_quadricula);

            var _escala = _camada.Escalas[_camada.Levantamentos.indexOf(parseInt(_cd_levantamento, 10))];
            var _strEscala = (_escala != '') ? '&nbsp;(' + _escala + ')' : '';
            var _lev = parseInt(_cd_levantamento, 10);

            if ($("#cboTipoMapaArticulado").val() == '9') {
                var _prefix_orto_2004 = (_lev == 11) ? '1O_' : (_lev == 12) ? '5O_' : '';
                _nm_arquivo = _prefix_orto_2004 + _nm_arquivo;
            }
            _nm_arquivo = (_lev == 10) ? _nm_arquivo.toUpperCase() : _nm_arquivo;
            //console.log(_nm_arquivo);


            if ($("#cboTipoMapaArticulado").val() == '11') {
                var strHTMLifr = "<iframe id=_ifrDown name=_ifrDown width=0 height=0 border=0></iframe>";
                var strLinkHTML = '';
                var arrSCM = (new String(_cd_quadricula + ';')).split(';');
                for (var i = 0; i < arrSCM.length - 1; i++) {

                    strLinkHTML = "<a class=down target=_ifrDown href=downloadIfr.aspx?orig=DownloadQuadriculas&arq=" + arrSCM[i] + "&arqTipo=PDF>PDF</a>";
                    strLinkHTML += "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<a class=down target=_ifrDown href=downloadIfr.aspx?orig=DownloadQuadriculas&arq=" + arrSCM[i] + "&arqTipo=DXF>DXF (zip)</a>";
                    strLinkHTML += "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<a class=down target=_ifrDown href=downloadIfr.aspx?orig=DownloadQuadriculas&arq=" + arrSCM[i] + "&arqTipo=MDT>MDT DXF (zip)</a>";
                }
                var strHTMLDiv = "<div id='divComboCamadas'>" + strLinkHTML + "</div>";
                jQuery('#divArquivos').html(strHTMLDiv + strHTMLifr);
                jQuery('#divDownloadArquivos').show();
            }
            else {
                var strHTMLifr = "<iframe id=_ifrDown name=_ifrDown width=0 height=0 border=0 src=downloadIfr.aspx?orig=DownloadMapaArticulacao&arq=" + escape(_nm_pasta + "\\" + _nm_arquivo) + "&arqTipo=MAPA_ARTICULACAO></iframe>";
                jQuery('#divArquivos').html(strHTMLifr);
                //strLinkHTML += "<a class=down target=_ifrDown href=downloadIfr.aspx?orig=DownloadMapaArticulacao&arq=" + escape(_nm_pasta + "\\" + _nm_arquivo) + "&arqTipo=MAPA_ARTICULACAO>" + _nm_arquivo + _strEscala + "</a>&nbsp;&nbsp;";
            }

        }
        else {
            _limpaSelecao();
            //antigo globalctlGetQuadriculaLatLon.activate();
            ativaSelecaoDownload();
            //document.getElementById('drag').style.display = "none";
            $('div.olLayerDiv').css('cursor', 'crosshair');
        }

    }

}

/*********************************************************
Nome: retornaDescClassViaria()
Objetivo: retorna a descrição das classificações viárias
Disparador(es): TrataJsonIntegracao
*********************************************************/


function retornaDescClassViaria(codigo) {
    switch (codigo) {
        case "1":
            return "ESTRUTURAL N1";
            break;
        case "2":
            return "ESTRUTURAL N2";
            break;
        case "3":
            return "ESTRUTURAL N3";
            break;
        case "4":
            return "COLETORA";
            break;
        case "5":
            return "LOCAL";
            break;
        case "6":
            return "LOCAL(VILA/RUA SEM SAIDA)";
            break;
        case "99":
            return "NAO DEFINIDO";
    }
}

/*********************************************************
Nome: retornaSiglaZoneamento()
Objetivo: retorna a sigla dos zoneamentos, tratando especificamente o caso de QA
Disparador(es): TrataJsonIntegracao
*********************************************************/

function retornaSiglaZoneamento(sigla) {
    if (sigla.trim() == 'QA') {
        return 'PA';
    }
    else {
        return sigla;
    }
}


/*********************************************************
Nome: retornaDescZoneamento()
Objetivo: retorna a descrição dos zoneamentos, tratando especificamente os casos de MA e PI
Disparador(es): TrataJsonIntegracao
*********************************************************/


function retornaDescZoneamento(sigla, perimetro, descricao) {

    if (sigla.trim() == 'MA') {
        switch (perimetro) {
            case "0001":
                return "Macroárea de Urbanização Consolidada - MUC";
                break;
            case "0002":
                return "Macroárea de Qualificação da Urbanização - MQU";
                break;
            case "0003":
                return "Macroárea de Redução da Vulnerabilidade Urbana - MRVU";
                break;
            case "0004":
                return "Macroárea de Redução da Vulnerabilidade Urbana e Recuperação Ambiental - MRVURA";
                break;
            case "0005":
                return "Macroárea de Controle e Qualificação Urbana e Ambiental - MCQUA";
                break;
            case "0006":
                return "Macroárea de Contenção Urbana e Uso Sustentável - MCUUS";
                break;
            case "0007":
                return "Macroárea de Preservação de Ecossistemas Naturais - MPEN";
                break;
            case "0008":
                return "MEM Subsetor Arco Leste";
                break;
            case "0009":
                return "MEM Subsetor Arco Tietê";
                break;
            case "0010":
                return "MEM Subsetor Arco Tamanduateí";
                break;
            case "0011":
                return "MEM Subsetor Arco Pinheiros";
                break;
            case "0012":
                return "MEM Subsetor Faria Lima - Água Espraiada - Chucri Zaidan";
                break;
            case "0013":
                return "MEM Subsetor Arco Jurubatuba";
                break;
            case "0014":
                return "MEM Subsetor Arco Jacu-Pêssego";
                break;
            case "0015":
                return "MEM Subsetor Avenida Cupecê";
                break;
            case "0016":
                return "MEM Subsetor Noroeste";
                break;
            case "0017":
                return "MEM Subsetor Fernão Dias";
                break;
            case "0018":
                return "MEM Subsetor Setor Central";
                break;
            default:
                return "Macroárea Indefinida";
        }
    }
    else if (sigla.trim() == 'PI') {
        switch (perimetro) {
            case "0001":
                return "Perímetro de Incentivo da Avenida Cupecê";
                break;
            case "0002":
                return "Perímetro de Incentivo da Fernão Dias";
                break;
            case "0003":
                return "Perímetro de Incentivo da Jacú-Pêssego";
                break;
            case "0004":
                return "Perímetro de Incentivo da Raimundo Pereira de Magalhães";
                break;
            default:
                return "Perímetro de Incentivo Indefinido";
        }
    }
    else if (sigla.trim() == 'QA') {
        if (perimetro == '0099') {
            return "Perímetro de Qualificação Ambiental Indefinido";
        }
        else {
            return "Perímetro de Qualificação Ambiental";
        }

    }
    else {
        return descricao;
    }
}


/*********************************************************
Nome: FormatarData()
Objetivo: FormatarData
**********************************************************/
function FormatarData(data) {
    var dia = data.substr(8, 2);
    var mes = data.substr(5, 2);
    var ano = data.substr(0, 4);
    var dataModificada = dia + '/' + mes + '/' + ano;
    return dataModificada;
}

/*********************************************************
Nome: FormatarDataHora()
Objetivo: FormatarData
**********************************************************/
function FormatarDataHora(data) {
    var dia = data.substr(8, 2);
    var mes = data.substr(5, 2);
    var ano = data.substr(0, 4);
    var hora = data.substr(11, 8);
    var dataHoraModificada = dia + '/' + mes + '/' + ano + ' ' + hora;
    return dataHoraModificada;
}



/*********************************************************
Nome: ListarInfoLote()
Objetivo: Chamar a pesquisa de informações de lote no banco 
**********************************************************/
ListarInfoLote = function (setor, quadra, condominio) {

    //configura o label com SQCOND parei aqui
    $('#lblLoteSetor').html(setor);
    $('#lblLoteQuadra').html(quadra);
    $('#lblLoteCondominio').html(condominio);

    loadingInfoLoteCondominio();

    urlWS = "_SBC.aspx/pesquisaLoteInfo";

    $.ajax({
        url: urlWS,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        type: "POST",
        data: "{'pCdSetor': '" + setor + "','pCdQuadra': '" + quadra + "','pCdCondominio': '" + condominio + "' }",
        success: function (data) {
            TrataJsonLoteInfo(data);
        },
        error: function (err) {
            closeloading();
            jAlert($.parseJSON(err.responseText).Message, 'Mensagem', function () { });
            return false;
        }
    });

}


/*********************************************************
Nome: TrataJsonLoteInfo()
Objetivo: Trata o Json retornado do banco e chama o carregamento do grid com as informações
**********************************************************/
function TrataJsonLoteInfo(JsonLoteInfo) {
    var table = "";
    var tableP = "";
    var tableF = "";
    var vSqls = "";

    $('#divSituacaoLoteInfo')[0].style.display = 'none';
    $('#gridDadosLoteInfo')[0].style.display = 'none';
    $('#gridDadosLoteInfoB')[0].style.display = 'none';
    $('#gridDadosLoteInfoC')[0].style.display = 'none';

    //varre o arquivo JSON

    var tableLoteInfo = "";
    var lenLoteInfo = 0;

    jQuery.each((JsonLoteInfo), function (jsoni2) {

        if (this != null) {
            lenLoteInfo = this.length;
            jQuery.each((this), function (jsoni3) {
                var strLinkHTML = "<a href=javascript:void(0); onclick=javascript:populaIntegracao('SQL','" + this.cd_setor_fiscal + "','" + this.cd_quadra_fiscal + "','" + this.cd_lote + "')>Clique aqui</a>";
                tableLoteInfo += "{ CodCndm: '" + TrataVal(this.cd_condominio)
                               + "', CodDigiSql: '" + TrataVal(this.cd_digito_sql)
                               + "', CodIdtLote: '" + TrataVal(this.cd_lote)
                               + "', CodLog: '" + TrataVal(this.cd_logradouro)
                               + "', CodLote: '" + TrataVal(this.cd_lote)
                               + "', CodNroPrta: '" + TrataVal(this.cd_numero_porta)
                               + "', CodQdrFisc: '" + TrataVal(this.cd_quadra_fiscal)
                               + "', CodSetFisc: '" + TrataVal(this.cd_setor_fiscal)
                               + "', CodSitu: '" + TrataVal(this.cd_situacao)
                               + "', CodTipLote: '" + TrataVal(this.cd_tipo_lote)
                               + "', CodTipQdr: '" + TrataVal(this.cd_tipo_quadra)
                               + "', NomLogdr: '" + TrataVal(this.nm_logradouro_completo).replace(/'/g, "\\'")
                               + "', CodContr: '" + ((this.cd_tipo_lote == 'F') ? TrataVal(this.cd_setor_fiscal + '.' + this.cd_quadra_fiscal + '.' + this.cd_lote + '-' + this.cd_digito_sql) : '')
                               //+ "', NomProp: '" + TrataVal(this.NomProp).replace(/'/g, "\\'")
                               + "', QtdAreaCont: '" + TrataVal(this.qt_area_construida)
                               + "', CdCib: '" + TrataVal(this.cd_cib)
                               + "', TxSituacaoCib: '" + TrataVal(this.tx_situacao_cib)
                               //+ "', QtdAreaTerr: '" + TrataVal(this.qt_area_terreno)
                              // + "', QtdAreaTerrCalc: '" + TrataVal(this.QtdAreaTerrCalc)
                               //+ "', QtdTstdCalc: '" + TrataVal(this.QtdTstdCalc)
                               + "', TxtSitu: '" + TrataVal(this.tx_situ_lote)
                               //+ "', TxtTipTerrImov: '" + TrataVal(this.dc_tipo_uso_imovel)
                               + "', TxtTipUsoImov: '" + TrataVal(this.dc_tipo_uso_imovel)
                               + "', TxtCompl: '" + TrataVal(this.tx_complemento_endereco).replace(/'/g, "\\'")
                               + "', Integracao: \"" + strLinkHTML + "\" },";
            });
        }

    });

    tableLoteInfo = eval("[" + tableLoteInfo + "]");

    carregaGridLoteInfo(lenLoteInfo, tableLoteInfo);

}

/*********************************************************
Nome: carregaGridLoteInfo()
Objetivo: Carrega o grid de integracao - utilizado no "SISZON"
**********************************************************/
carregaGridLoteInfo = function (lenLoteInfo, tableLoteInfo) {


    //Caso não tenha registros exibe mensagem de erro e sai da função
    if (tableLoteInfo.length == 0) {
        jAlert('Não há lotes neste condomínio', 'Mensagem', function () { });
        closeloadingInfoLoteCondominio();
        return false;
    }

    //Prepara os elementos HTML para montagem do grid 
    var rnd = (Math.random()).toString().replace('.', '').substring(0, 5);
    var idT = 'T_' + rnd;
    var idP = 'P_' + rnd;
    var idPH = 'PH_' + rnd;
    var idM = 'M_' + rnd;
    var idH = 'H_' + rnd;
    var idPC = 'Q' + rnd;
    var idPCo = 'R' + rnd

    var strHTMLhdr = "<table id=" + idH + "></table><br>";
    var strHTMLpgrh = "<div id=" + idPH + "></div>";
    var strHTMLtbl = "<table id=" + idT + "></table>";
    var strHTMLpgr = "<div id=" + idP + "></div>";
    jQuery('#gridDadosLoteInfo').html(strHTMLhdr + strHTMLpgrh + strHTMLtbl + strHTMLpgr).css('text-align', '-webkit-center');
    var gridLoteInfo = jQuery('#' + idH);

    //Função que instancia o componente jqGrid
    montaGridLoteInfo = function () {

        gridLoteInfo.jqGrid({
            datatype: "local",
            data: tableLoteInfo,
            height: "100%",
            colNames: ["Lote", "Dígito", "Codlog", "Código Contribuinte", "Nome Logradouro", "Núm.Porta", "Complemento", "Uso", "Área.Const", "Código CIB", "Sit. Cód. CIB"], /*"Proprietário", "Integracao"],*/
            colModel: [{ name: 'CodLote', index: 'CodLote', width: '40', sortable: true, align: 'center' },
                        { name: 'CodDigiSql', index: 'CodDigiSql', width: '40', title: false, sortable: true, align: 'center' },
                        { name: 'CodLog', index: 'CodLog', width: '62', title: false, sortable: true, align: 'center' },
                        { name: 'CodContr', index: 'CodContr', width: '130', title: false, sortable: true, align: 'center' },
                        { name: 'NomLogdr', index: 'NomLogdr', width: '210', title: false, sortable: true, align: 'center' },
                        { name: 'CodNroPrta', index: 'CodNroPrta', width: '70', title: false, sortable: true, align: 'center' },
                        { name: 'TxtCompl', index: 'TxtCompl', width: '84', title: false, sortable: true, align: 'center' },
                        { name: 'TxtTipUsoImov', index: 'TxtTipUsoImov', width: '120', title: false, sortable: true, align: 'center' },
                        { name: 'QtdAreaCont', index: 'QtdAreaCont', width: '63', title: false, sortable: true, align: 'center' },
                        { name: 'CdCib', index: 'CdCib', width: '90', title: false, sortable: true, align: 'center' },
                        { name: 'TxSituacaoCib', index: 'TxSituacaoCib', width: '110', title: false, sortable: true, align: 'center' }],
            // { name: 'NomProp', index: 'NomProp', width: '170', title: false, sortable: true, align: 'center' },
            // { name: 'Integracao', index: 'Integracao', width: '80', title: false, sortable: true, align: 'center' }],
            multiselect: false,
            caption: "INFORMAÇÕES DOS LOTES DO CONDOMÍNIO",
            pager: idP,
            rowNum: 13,
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

                closeloadingInfoLoteCondominio();

            }
        });
    }

    //Chamada da função que monta e exibe o grid
    jQuery('#divJanelaDadosLoteInfo').css('height', '435px');
    jQuery('#divDadosLoteInfo').css('height', '505px').show();
    montaGridLoteInfo();
    $('#gridDadosLoteInfo')[0].style.display = 'block';
    jQuery("div.ui-jqgrid-view").children("div.ui-jqgrid-titlebar").css("text-align", "center").children("span.ui-jqgrid-title").css("float", "none");
    closeloading();


}

