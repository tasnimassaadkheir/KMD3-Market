//***************************************************************************************************************************************************
//***************************************************************************************************************************************************
//Nome: controlaNiveisInformacao()
//Objetivo: 
//Disparador(es):
//***************************************************************************************************************************************************
//***************************************************************************************************************************************************
function controlaNiveisInformacao(zoom) {
    jQuery.getJSON('../js/Layers.js', function (json5) {

        var contadorCamadas = 0;
        var comboDinamico = '';
        var comboDinamicoPai = '';
        var comboDinamicoFilho = '';
        var layerPai6, layerPai7, layerPai8;
        layerPai6 = layerPai7 = layerPai8 = '';
        var exibePai = false;

        //zera arrays
        layersPaiInfo = Array();
        layersFilhoInfo = Array();

        //comboDinamico = comboDinamico + "<option value=''>Selecione a camada</option>";

        //varre o arquivo JSON
        jQuery.each(json5.layersMapa, function (json6) {
            if (this.ativo == 'true') {
                if (this.subcamadas != undefined && this.subcamadas.length > 0) {
                    for (var i = 0; i < this.subcamadas.length; i++) {
                        //exibePai = eval(this.subcamadas[i].info.informacao);
                        //if (exibePai) break;
                        if (eval(this.subcamadas[i].info.informacao) && document.getElementById(this.subcamadas[i].layerID).checked) {
                            exibePai = true;
                            break;
                        } else {
                            exibePai = false;
                        }
                    }
                }
                if (eval(this.agrupador) && exibePai) {
                    ////  comboDinamicoPai += '<option value="' + this.layerID + '">' + this.layerLabel + '</option>';

                    criaArrayInfoPai(this.layerID, this.layerLabel);  //$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$

                    layerPai6 = this.layerID;
                    //console.log('json6-PAI: ' + layerPai6);

                }

                //como verificar se deve ser mostrado no zoom atual
                var arrayZoomExib = this.aparencia.zoomExib.split("#");
                if ($.inArray(zoom.toString(), arrayZoomExib) != -1 && document.getElementById(this.layerID).checked) {
                    if (this.info.informacao == 'true') {

                        //console.log('json6: ' + this.info.infoNome);
                        ////   comboDinamicoFilho += "<option tipo='" + layerPai6 + "' value='" + this.info.infoLayer + "|" + this.info.infoGeom + "|" + this.info.infoCampos + "|" + this.info.infoLabels + "|" + this.info.tipo + "'>" + this.info.infoNome + "</option>";
                        //cria os options no combo de selecao de camadas 
                        //comboDinamico = comboDinamico + "<option value='" + this.info.infoLayer + "|" + this.info.infoGeom + "'>" + this.layerLabel + "</option>";

                        criaArrayInfoFilho(this.layerID, layerPai6, this.info.infoLayer, this.info.infoGeom, this.info.infoCampos, this.info.infoLabels, this.info.tipo, this.info.infoNome);  //$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$

                        ////   comboDinamico = comboDinamico + "<option value='" + this.info.infoLayer + "|" + this.info.infoGeom + "|" + this.info.infoCampos + "|" + this.info.infoLabels + "|" + this.info.tipo + "'>" + this.info.infoNome + "</option>";
                        contadorCamadas = contadorCamadas + 1;
                    }
                }
                //fim como verificar se deve ser mostrado no zoom atual


                /*
                if (this.aparencia.zoomMin <= zoom && zoom <= this.aparencia.zoomMax) {
                if (this.info.informacao == 'true') {
                //cria os options no combo de selecao de camadas
                //comboDinamico = comboDinamico + "<option value='" + this.info.infoLayer + "|" + this.info.infoGeom + "'>" + this.layerLabel + "</option>";
                comboDinamico = comboDinamico + "<option value='" + this.info.infoLayer + "|" + this.info.infoGeom + "|" + this.info.infoCampos + "|" + this.info.infoLabels + "'>" + this.layerLabel + "</option>";
                contadorCamadas = contadorCamadas + 1;
                }
                }*/
            }

            //Se tiver subcamadas, varre todas deste agrupador verificando se deve ou nao exibir informacoes
            jQuery.each(this.subcamadas, function (json7) {
                if (this.ativo == 'true') {

                    if (this.subcamadas != undefined && this.subcamadas.length > 0) {
                        for (var i = 0; i < this.subcamadas.length; i++) {
                            //exibePai = eval(this.subcamadas[i].info.informacao);
                            //if (exibePai) break;
                            if (eval(this.subcamadas[i].info.informacao) && document.getElementById(this.subcamadas[i].layerID).checked) {
                                exibePai = true;
                                break;
                            } else {
                                exibePai = false;
                            }
                        }
                    }
                    if (eval(this.agrupador) && exibePai) {
                        ////   comboDinamicoPai += '<option value="' + this.layerID + '">' + this.layerLabel + '</option>';

                        criaArrayInfoPai(this.layerID, this.layerLabel);  //$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$

                        layerPai7 = this.layerID;
                        //console.log('json7-PAI: ' + layerPai7);
                    }


                    //como verificar se deve ser mostrado no zoom atual
                    var arrayZoomExib = this.aparencia.zoomExib.split("#");
                    if ($.inArray(zoom.toString(), arrayZoomExib) != -1 && document.getElementById(this.layerID).checked) {
                        if (this.info.informacao == 'true') {

                            //console.log('json7: ' + this.info.infoNome);
                            ////   comboDinamicoFilho += "<option tipo='" + layerPai6 + "' value='" + this.info.infoLayer + "|" + this.info.infoGeom + "|" + this.info.infoCampos + "|" + this.info.infoLabels + "|" + this.info.tipo + "'>" + this.info.infoNome + "</option>";
                            //cria os options no combo de selecao de camadas

                            criaArrayInfoFilho(this.layerID, layerPai6, this.info.infoLayer, this.info.infoGeom, this.info.infoCampos, this.info.infoLabels, this.info.tipo, this.info.infoNome);  //$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$

                            ////   comboDinamico = comboDinamico + "<option value='" + this.info.infoLayer + "|" + this.info.infoGeom + "|" + this.info.infoCampos + "|" + this.info.infoLabels + "|" + this.info.tipo + "'>" + this.info.infoNome + "</option>";
                            contadorCamadas = contadorCamadas + 1;
                        }
                    }
                    //fim como verificar se deve ser mostrado no zoom atual


                    /*
                    if (this.aparencia.zoomMin <= zoom && zoom <= this.aparencia.zoomMax) {
                    if (this.info.informacao == 'true') {
                    //cria os options no combo de selecao de camadas
                    comboDinamico = comboDinamico + "<option value='" + this.info.infoLayer + "|" + this.info.infoGeom + "|" + this.info.infoCampos + "|" + this.info.infoLabels + "'>" + this.layerLabel + "</option>";
                    contadorCamadas = contadorCamadas + 1;
                    }
                    }*/
                }

                //**********************
                //Se tiver subcamadas nível 2, varre todas deste agrupador verificando se deve ou nao exibir informacoes
                jQuery.each(this.subcamadas, function (json8) {
                    if (this.ativo == 'true') {

                        if (this.subcamadas != undefined && this.subcamadas.length > 0) {
                            for (var i = 0; i < this.subcamadas.length; i++) {
                                //exibePai = eval(this.subcamadas[i].info.informacao);
                                //if (exibePai) break;
                                if (eval(this.subcamadas[i].info.informacao) && document.getElementById(this.subcamadas[i].layerID).checked) {
                                    exibePai = true;
                                    break;
                                } else {
                                    exibePai = false;
                                }
                            }
                        }
                        if (eval(this.agrupador) && exibePai) {
                            ////  comboDinamicoPai += '<option value="' + this.layerID + '">' + this.layerLabel + '</option>';

                            criaArrayInfoPai(this.layerID, this.layerLabel);  //$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$

                            layerPai8 = this.layerID;
                            //console.log('json8-PAI: ' + layerPai8);
                        }


                        //como verificar se deve ser mostrado no zoom atual
                        var arrayZoomExib = this.aparencia.zoomExib.split("#");
                        if ($.inArray(zoom.toString(), arrayZoomExib) != -1 && document.getElementById(this.layerID).checked) {
                            if (this.info.informacao == 'true') {
                                //console.log('json8: ' + this.info.infoNome);
                                ////    comboDinamicoFilho += "<option tipo='" + layerPai7 + "' value='" + this.info.infoLayer + "|" + this.info.infoGeom + "|" + this.info.infoCampos + "|" + this.info.infoLabels + "|" + this.info.tipo + "'>" + this.info.infoNome + "</option>";

                                criaArrayInfoFilho(this.layerID, layerPai7, this.info.infoLayer, this.info.infoGeom, this.info.infoCampos, this.info.infoLabels, this.info.tipo, this.info.infoNome);  //$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$

                                //cria os options no combo de selecao de camadas
                                ////    comboDinamico = comboDinamico + "<option value='" + this.info.infoLayer + "|" + this.info.infoGeom + "|" + this.info.infoCampos + "|" + this.info.infoLabels + "|" + this.info.tipo + "'>" + this.info.infoNome + "</option>";
                                contadorCamadas = contadorCamadas + 1;
                            }
                        }
                        //fim como verificar se deve ser mostrado no zoom atual

                    }
                });  //fim loop subcamadas nivel 2


                //*********************

            });  //fim loop subcamadas
        });

        if (contadorCamadas != 0) {
            //console.log('comboDinamico');
            //console.log(comboDinamico);
            //console.log(comboDinamicoPai);
            //console.log(comboDinamicoFilho);
            ////    comboDinamicoPai = '<option value="">Selecione um grupo</option>' + comboDinamicoPai;
            ////    comboDinamicoFilho = comboDinamicoFilho;
            //joga o combo gerado dinamicamente ao combo da tela
            //old ie8 document.getElementById("cboCamada").innerHTML = comboDinamico;
            ////    jQuery('#cboCamada').html(comboDinamico);
            ////    jQuery('#cboCamadaPai').html(comboDinamicoPai);
            ////    jQuery('#cboCamadaFilhoH').html(comboDinamicoFilho);

            ////    $("#cboCamada").html($('#cboCamada option').sort(function (x, y) {
            ////        return $(x).text().replace('Á', 'A') < $(y).text().replace('Á', 'A') ? -1 : 1;
            ////    }));

            //adiciona opção default fora da ordenação
            ////    var atual = jQuery('#cboCamada').html();
            ////    jQuery('#cboCamada').html("<option value=''>Selecione a camada</option>" + atual);


            //Habilita a exibição do botão de informação
            if (globalctlBtnExibeInfo.panel_div.className == "ctlBtnExibeInfoItemActive olButton") {
                globalctlBtnExibeInfo.panel_div.className = "ctlBtnExibeInfoItemActive olButton";
            } else {
                globalctlBtnExibeInfo.panel_div.className = "ctlBtnExibeInfoItemInactive olButton";
            }

            habilitaInfo = true;
        } else {
            //Desabilita a exibição do botão de informação
            habilitaInfo = false;
            globalctlBtnExibeInfo.panel_div.className = "ctlBtnExibeInfoItemInactiveTransparent olButton";
        }
    });

    //***************************************************************************************************************************************************
    //***************************************************************************************************************************************************
    //Nome: criaArrayInfoPai()
    //Objetivo: Cria um array com todas as camadas "Pai" que estão visíveis e que pode ter informação nesse nível de zoom. Esse array é usado no momento do obter informação para 
    //varrer todas essas camadas e verificar em cada uma qual tem informação realmente, listando apenas essas.
    //Disparador(es):
    //***************************************************************************************************************************************************
    //***************************************************************************************************************************************************

    function criaArrayInfoPai(layerID, layerLabel) {
        var layersPaiInfoTmp = {
            layerID: layerID,
            layerLabel: layerLabel,
            exibeCombo: false
        };

        layersPaiInfo.push(layersPaiInfoTmp);
    }


    //***************************************************************************************************************************************************
    //***************************************************************************************************************************************************
    //Nome: criaArrayInfoFilho()
    //Objetivo: Cria um array com todas as camadas "Filho" que estão visíveis e que pode ter informação nesse nível de zoom. Esse array é usado no momento do obter informação para 
    //varrer todas essas camadas e verificar em cada uma qual tem informação realmente, listando apenas essas.
    //Disparador(es):
    //***************************************************************************************************************************************************
    //***************************************************************************************************************************************************

    function criaArrayInfoFilho(layerID, layerPaiID, infoLayer, infoGeom, infoCampos, infoLabels, infoTipo, infoNome) {
        var layersFilhoInfoTmp = {
            layerID: layerID,
            layerPaiID: layerPaiID,
            info_infoLayer: infoLayer,
            info_infoGeom: infoGeom,
            info_infoCampos: infoCampos,
            info_infoLabels: infoLabels,
            info_tipo: infoTipo,
            info_infoNome: infoNome
        };

        layersFilhoInfo.push(layersFilhoInfoTmp);
    }

}



function criaArrayLayersInfo(item) {

    var layerID = item.layerID;
    var layerLabel = item.layerLabel;
    var ordemExib = item.ordemExib;
    var info_tipo = item.info.tipo;
    var info_infoNome = item.info.infoNome;
    var info_infoLayer = item.info.infoLayer;
    var info_infoGeom = item.info.infoGeom;
    var info_infoCampos = item.info.infoCampos;
    var info_infoLabels = item.info.infoLabels;
    var aparencia_zoomExib = item.aparencia.zoomExib;


    var layersInfoTmp = {
        layerID: layerID,
        layerLabel: layerLabel,
        ordemExib: ordemExib,
        info_tipo: info_tipo,
        info_infoNome: info_infoNome,
        info_infoLayer: info_infoLayer,
        info_infoGeom: info_infoGeom,
        info_infoCampos: info_infoCampos,
        info_infoLabels: info_infoLabels,
        aparencia_zoomExib: aparencia_zoomExib
    };

    layersInfo.push(layersInfoTmp);
}



//**********************************************************************************************
//**********************************************************************************************
//**********************************************************************************************

/*********************************************************
Nome: listaFeicoesAtivasClicadas()
Objetivo: xxxxxxxxxxxxxxxxxxx
Disparador(es): xxxxxxxxxxxxxxxxxxx
**********************************************************/

function listaFeicoesAtivasClicadas() {

    //Se já tiver feito uma pesquisa, o(s) vectors(s) já estará(ão) no mapa. Deve ser excluída antes de incluir uma nova
    resetaCamadaObterInformacao();


    //limpa combo de camadas visíveis e selecionadas
    jQuery('#cboCamadaFilhoH').html("<option value=''> Selecione a camada</option>");
    jQuery('#cboCamadaPai').html("<option value=''> Selecione um grupo</option>");

    for (i = 0; i < layersPaiInfo.length; i++) {
        for (y = 0; y < layersFilhoInfo.length; y++) {
            if (layersFilhoInfo[y].layerPaiID == layersPaiInfo[i].layerID) {
                getLayerInfoEmLote(layersFilhoInfo[y].layerID, layersFilhoInfo[y].info_infoLayer, layersFilhoInfo[y].info_infoGeom, layersFilhoInfo[y].info_infoCampos, layersFilhoInfo[y].info_infoLabels, layersFilhoInfo[y].info_tipo, layersFilhoInfo[y].info_infoNome);
            };
        }
    }
}

getLayerInfoEmLote = function (layerID, nmCamada, nmGeometria, Campofeatures, Labelfeatures, tipo, nomeInfo) {

    var Campofeatures;
    var Labelfeatures;

    loading();

    //Deixa por default uma mensagem no lugar do grid. Se o evento featureadded for chamado, o grid substituirá a mensagem
    document.getElementById("gridPesqInfo").innerHTML = "";

    var _hc = jQuery('#hc', window.parent.document).val();
    var precisao = Math.round(10 * map.getResolution());
    var Campofeatures = Campofeatures.split('#');
    var Labelfeatures = Labelfeatures.split('#');

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
                cql_filter: "DWITHIN(" + nmGeometria + ", POINT (" + lonLatSelecao.lon + " " + lonLatSelecao.lat + ")," + precisao + ", meters)"
            },
            format: new OpenLayers.Format.GML({
                geometryName: nmGeometria
            })
        };
    } else if (tipo == 'WFS_EXTERNO_HABITASAMPA') {
        //cria vetor filtrando pela coordenada X, Y
        var wfsPesqInfos_options = {
            url: 'map.geo?hc=' + _hc + '&tipoServico=WFS_EXTERNO_HABITASAMPA',
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
    } else if (tipo == 'WFS_EXTERNO_GEOAMBIENTAL') {
        //cria vetor filtrando pela coordenada X, Y
        var wfsPesqInfos_options = {
            url: 'map.geo?hc=' + _hc + '&tipoServico=WFS_EXTERNO_GEOAMBIENTAL',
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
    } else if (tipo == 'WFS_EXTERNO_GEOPATRI') {
        //cria vetor filtrando pela coordenada X, Y
        var wfsPesqInfos_options = {
            url: 'map.geo?hc=' + _hc + '&tipoServico=WFS_EXTERNO_GEOPATRI',
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
        } else if (tipo == 'WFS_EXTERNO_PARCELAMENTO') {
        //cria vetor filtrando pela coordenada X, Y
        var wfsPesqInfos_options = {
            url: 'map.geo?hc=' + _hc + '&tipoServico=WFS_EXTERNO_PARCELAMENTO',
            params: {
                request: "GetFeature",
                service: "wfs",
                version: "1.0.0",
                typeName: nmCamada,
                featureType: nmCamada,
                //a camada não está com SRS Nativo 31983 no banco, por isso foi necessário reprojetar o ponto aqui
                cql_filter: "DWITHIN(" + nmGeometria + ", SRID=31983; POINT (" + lonLatSelecao.lon + " " + lonLatSelecao.lat + ")," + precisao + ", meters)"
            },
            format: new OpenLayers.Format.GML({
                geometryName: nmGeometria
            })
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


    var layerInfoTEMP = new OpenLayers.Layer.Vector("vetorInfo_" + layerID, {
        strategies: [new OpenLayers.Strategy.Fixed()],
        protocol: new OpenLayers.Protocol.HTTP(wfsPesqInfos_options),
        styleMap: new OpenLayers.Style(OpenLayers.Feature.Vector.style["select"])
    });


    eval("vetorInfo_" + layerID + " = layerInfoTEMP");
    map.addLayer(eval("vetorInfo_" + layerID));

    //adiciona camada no array para ser excluída depois
    layersVectorInfoTemp.push("vetorInfo_" + layerID);

    document.getElementById("InfoFlutuante").innerHTML = '';

    closeloading();

    eval("vetorInfo_" + layerID).events.register("featuresadded", this, function (e) {
        //console.log(layerInfo.features);
        loading();
        var LayerInfoFeat = eval("vetorInfo_" + layerID).features;


        //se a camada do obter informacao for lote e for condominio aciona a pesquisa dos lotes
        //as linhas abaixo devem estar comentadas se o recurso não for utilizado
        //INICIO

        if (nomeInfo == 'Lote') {

            if (LayerInfoFeat[0].attributes.cd_condominio != 'Em análise') {

                if (LayerInfoFeat[0].attributes.cd_condominio != '00') {

                    var setor = LayerInfoFeat[0].attributes.cd_setor_fiscal;
                    var quadra = LayerInfoFeat[0].attributes.cd_quadra_fiscal;
                    var condominio = LayerInfoFeat[0].attributes.cd_condominio;

                    //loading();

                    ListarInfoLote(setor, quadra, condominio);

                }

            }
        }

        //FIM

        //cria o array com os valores das features
        var valores = "[";

        for (var i = 0; i < LayerInfoFeat.length; i++) {
            valores += "{";
            //Varre todos os camposFeatures que deve ter no grid
            for (var c = 0; c < Campofeatures.length; c++) {

                if (LayerInfoFeat[i].attributes[Campofeatures[c]] != undefined) {
                    valores += Campofeatures[c] + ": '" + LayerInfoFeat[i].attributes[Campofeatures[c]].replace("'", "").replace(/[\r\n]/gm, '') + "',"
                } else {
                    valores += Campofeatures[c] + ": '" + LayerInfoFeat[i].attributes[Campofeatures[c]] + "',"
                }


            }
            valores = valores.substring(0, valores.length - 1);
            valores += "},";
        }
        valores = valores.substring(0, valores.length - 1);
        valores += "]";
        // 1) Escapar apóstrofo ENTRE letras
        valores = valores.replace(
            /([A-Za-zÀ-ÖØ-öø-ÿ])'([A-Za-zÀ-ÖØ-öø-ÿ])/g,
            "$1\\'$2"
        );

        // 2) faz o eval
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
        // 1) Escapar apóstrofo ENTRE letras
        table = table.replace(
            /([A-Za-zÀ-ÖØ-öø-ÿ])'([A-Za-zÀ-ÖØ-öø-ÿ])/g,
            "$1\\'$2"
        );

        // 2) faz o eval
        tablec = eval(table);

        var rowNumDinamic = Labelfeatures.length;  //essa variável será utilizada para fazer a "quebra de página" no grid a cada registro de features.

        tmpListaInfoGrid = {
            nomeInfo: nomeInfo,
            dados: tablec,
            linhas: rowNumDinamic
        };

        globalListaInfoGrid.push(tmpListaInfoGrid);

        //Exibe na div de informação flutuante
        var tmpHtml = "";
        //var tmpHtml = "<table style='color:White;'><tr><td><a href='#' onclick='document.getElementById('InfoFlutuante').style.display = 'none'; document.getElementById('InfoFlutuanteContorno').style.display = 'none';inativaPesqInfo();'>Fechar painel</a></td></tr></table>"

        for (i = 0; i < globalListaInfoGrid.length; i++) {

            //desabilitar link para informação no ObterInformação
            /*
            if (globalListaInfoGrid[i].nomeInfo == "Lote") {
                //SQL
                var vSetor = globalListaInfoGrid[i].dados[0].valor;
                var vQuadra = globalListaInfoGrid[i].dados[2].valor;
                var vLote = globalListaInfoGrid[i].dados[5].valor;

                //cabeçalho da informação
                tmpHtml = tmpHtml + "<table class='InfoFlutuanteCabecalho'><tr><td>" + globalListaInfoGrid[i].nomeInfo + "</td><td style='text-align: right;'><a href='#' onclick=\"populaIntegracao('SQL','" + vSetor + "','" + vQuadra + "','" + vLote + "')\"; style='color: white'>Integração</a>" + "</td></tr></table>";
            } else if (globalListaInfoGrid[i].nomeInfo == "Logradouro SF") {
                //Endereço                
                var vCodlog = globalListaInfoGrid[i].dados[1].valor + globalListaInfoGrid[i].dados[2].valor;

                //cabeçalho da informação
                tmpHtml = tmpHtml + "<table class='InfoFlutuanteCabecalho'><tr><td>" + globalListaInfoGrid[i].nomeInfo + "</td><td style='text-align: right;'><a href='#' onclick=\"populaIntegracao('END','" + vCodlog + "','','')\"; style='color: white'>Integração</a>" + "</td></tr></table>";
            } else if (globalListaInfoGrid[i].nomeInfo == "Logradouro") {
                //Endereço                
                var vCodlog = globalListaInfoGrid[i].dados[0].valor;

                //cabeçalho da informação
                tmpHtml = tmpHtml + "<table class='InfoFlutuanteCabecalho'><tr><td>" + globalListaInfoGrid[i].nomeInfo + "</td><td style='text-align: right;'><a href='#' onclick=\"populaIntegracao('END','" + vCodlog + "','','')\"; style='color: white'>Integração</a>" + "</td></tr></table>";

            } else if (globalListaInfoGrid[i].nomeInfo == "Subprefeitura") {
                //Cód Subprefeitura
                var vCodSub = globalListaInfoGrid[i].dados[0].valor;

                tmpHtml = tmpHtml + "<table class='InfoFlutuanteCabecalho'><tr><td>" + globalListaInfoGrid[i].nomeInfo + "</td><td style='text-align: right;'><a href='#' onclick=\"populaIntegracao('SUB','" + vCodSub + "','','')\"; style='color: white'>Integração</a>" + "</td></tr></table>";
            } else {
            */
            //cabeçalho da informação
            tmpHtml = tmpHtml + "<table class='InfoFlutuanteCabecalho'><tr><td>" + globalListaInfoGrid[i].nomeInfo + "</td></tr></table>";
            //}



            //informações
            tmpHtml = tmpHtml + "<table>";
            var dadosTmp = globalListaInfoGrid[i].dados;

            //Para a camada Lote, permitir que popule automaticamente os campos da integração
            for (j = 0; j < dadosTmp.length; j++) {
                tmpHtml = tmpHtml + "<tr><td class='InfoFlutuanteFeature'>" + dadosTmp[j].feature + ": </td><td class='InfoFlutuanteValor'>" + aplicaHyperlink(dadosTmp[j].valor) + "</td></tr>";
            }

            tmpHtml = tmpHtml + "</table>";
        }

        document.getElementById("InfoFlutuante").innerHTML = tmpHtml;



        //Coloca no combo
        //jQuery('#cboCamadaPai').html(comboDinamicoPai);
        //jQuery('#cboCamadaFilhoH').html(comboDinamicoFilho);


        //busca o nome do grupo (pai) dessa camada
        /*       for (i = 0; i < layersFilhoInfo.length; i++) {
        if (layersFilhoInfo[i].layerID == layerID) {
        var vPai = layersFilhoInfo[i].layerPaiID;
        break;
        }
        }

        //busca o LABEL do grupo (pai) dessa camada pelo ID
        for (j = 0; j < layersPaiInfo.length; j++) {
        if (layersPaiInfo[j].layerID == vPai) {
        var vPaiLabel = layersPaiInfo[j].layerLabel;
        break;
        }
        }

        //verifica se já existe option com esse valor
        var comboPai = jQuery('#cboCamadaPai')[0];

        var existePai = 'false';
        for (y = 0; y < comboPai.children.length; y++) {
        if (comboPai.children[y].text == vPaiLabel) {
        existePai = 'true';
        }
        }

        //Coloca item no combo do grupo caso ainda não exista
        if (existePai == 'false') {
        var optionNovaPai = document.createElement("option");
        optionNovaPai.value = vPai;
        optionNovaPai.innerHTML = vPaiLabel;
        comboPai.appendChild(optionNovaPai);

        //Ordena
        $("#cboCamadaPai").html($('#cboCamadaPai option').sort(function (x, y) {
        return $(x).text().replace('Á', 'A') < $(y).text().replace('Á', 'A') ? -1 : 1;
        }));
        }

        //Coloca no combo da camada Hide
        var comboFilhoH = jQuery('#cboCamadaFilhoH')[0]
        var optionNovaH = document.createElement('option');
        optionNovaH.value = nomeInfo;
        optionNovaH.text = nomeInfo;
        optionNovaH.setAttribute('tipo', vPai);
        comboFilhoH.options.add(optionNovaH);


        //Ordena
        $("#cboCamadaFilhoH").html($('#cboCamadaFilhoH option').sort(function (x, y) {
        return $(x).text().replace('Á', 'A') < $(y).text().replace('Á', 'A') ? -1 : 1;
        }));



        //Habilita a exibição do botão de informação
        if (globalctlBtnExibeInfo.panel_div.className == "ctlBtnExibeInfoItemActive olButton") {
        globalctlBtnExibeInfo.panel_div.className = "ctlBtnExibeInfoItemActive olButton";
        } else {
        globalctlBtnExibeInfo.panel_div.className = "ctlBtnExibeInfoItemInactive olButton";
        }
        */
        closeloading();
        //carregaGridInfoDinamico(rowNumDinamic, tablec);
    });

    /*
    }
    else {
    document.getElementById("gridPesqInfo").innerHTML = "";
    //jAlert('Selecione uma camada', 'Mensagem', function () { });
    }*/

    //muda cursor das layers para crosshair pois o controle de info ainda está selecionado
    $('div.olLayerDiv').css('cursor', 'crosshair')

}




/*********************************************************
Nome: populaIntegracao()
Objetivo: Popula os campos de integração vindo da busca de informações
Disparador(es): 
**********************************************************/
populaIntegracao = function (tipo, par1, par2, par3) {
    //Abre DIV de pesquisa, seleciona Aba de Integração e popula campos            

    if (tipo == "SQL") {
        TxtIntSetor.value = par1;
        TxtIntQuadra.value = par2;
        TxtIntLote.value = par3;

        showAbaPesquisa('08');
        showAbaPesquisa('11');
    } else {
        cboTIPO_COD.value = par1;
        cboTITULO_COD.value = par2;
        nome.value = par3;

        showAbaPesquisa('06');
    }

    controlesClick(globalctlBtnPesquisaLogradouro, "C");
    _abreFormPesquisaLogradouro();
    //TxtCodlog
}


/*********************************************************
Nome: resetaInfoPesq()
Objetivo: Remove seleções de quadrículas da memória
Disparador(es): 
**********************************************************/
resetaInfoPesq = function () {

    //Remove todas as seleções de quadras
    /*if (vectorQuadrasSelecionadas != undefined && vectorQuadrasSelecionadas.features != []) {
    vectorQuadrasSelecionadas.removeAllFeatures();
    }*/

    //Se já tiver feito uma pesquisa, o layer já estará no mapa. Deve ser excluída antes de incluir uma nova
    var arrLayerInfo = map.getLayersByName("LayerInfo");
    if (arrLayerInfo.length > 0) {
        map.removeLayer(arrLayerInfo[0]);
    }
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



/*********************************************************
Nome: inativaPesqInfo()
Objetivo: Inativa o controle de Pesquisa de Informações
Parâmetro(s):
Disparador(es):
**********************************************************/

inativaPesqInfo = function () {
    //map.controls[10].deactivate();
    globalctlBtnExibeInfo.panel_div.className = globalctlBtnExibeInfo.displayClass + "ItemInactive olButton";
    document.getElementById('infoDrag').style.display = "none";


    document.getElementById('InfoFlutuante').style.display = "none";
    document.getElementById('InfoFlutuanteContorno').style.display = "none";

    globalctlPegaLatLon.deactivate();
    $('div.olLayerDiv').css('cursor', 'default')
    //Limpa seleções feitas pela busca de informações

    resetaInfoPesq();
    resetaCamadaObterInformacao()


    $("#InfoFlutuante").html("");


}



/*********************************************************
Nome: carregaGridInfoDinamico()
Objetivo: Monta e exibe grid com pesquisa de Informacoes da camada selecionada no combo
Parâmetro(s):
Disparador(es): botao da tela de informacoes
*********************************************************/

carregaGridInfoDinamico = function (rowNumDinamic, table) {

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
    jQuery('#gridPesqInfo').html(strHTMLtbl + strHTMLpgr);
    var grid = jQuery('#' + idT);


    //Função que instancia o componente jqGrid
    montaGridLogradouros = function () {

        grid.jqGrid({
            datatype: "local",
            data: arrLogs,
            height: "auto",
            colNames: ["Feature", "Valor"],
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
    montaGridLogradouros();

}


/*********************************************************
Nome: autoLink(valor)
Objetivo: Aplica link em conteudo de string quando esta contiver http ou https
Disparador(es): aplicaHyperlink
**********************************************************/

autoLink = function (string) {
    // Regex para encontrar links HTTP ou HTTPS
    var regex = /http(s)?:\/\/\S+/g;

    // Substituir links encontrados na string
    var stringWithLinks = string.replace(regex, function (match) {
        return '<a href="' + match + '" target="_blank">' + match + '</a>';
    });

    return stringWithLinks;
}



/*********************************************************
Nome: aplicaHyperlink(valor)
Objetivo: Aplica hyperlink em atributo Botão I de acordo com valor ou necessidade
Disparador(es): getLayerInfoEmLote
**********************************************************/

aplicaHyperlink = function (valor) {

    //se o valor contiver endereço web
    valor = autoLink(valor);

    //se for planta de DESAP, habilita link para abrir arquivo de acordo com o local dos mesmos
    if (valor.toLowerCase().indexOf('nas.prodam/sn1403_64') > -1) {
        var nomeArquivo = valor.substring(valor.lastIndexOf('/') + 1);
        var strHTMLifr = "<iframe id=_ifrDown name=_ifrDown width=0 height=0 border=0></iframe>";
        jQuery('#divArquivos').html(strHTMLifr);
        valor = "<a class='down' target='_ifrDown' href=downloadIfr.aspx?orig=DownloadPlantaDISDUP&arqTipo=DIS_DUP&arq=" + nomeArquivo + ">" + nomeArquivo + "</a>";

    };

    //se for licença ambiental industrial, habilita link para abrir de acordo com os padrões de nomenclatura dos arquivos.
    if ((valor.match('^CDLA_')) ||
        (valor.match('^DAILA_')) ||
        (valor.match('^Encerramento_')) ||
        (valor.match('^LAI_071_21')) ||
        (valor.match('^LAO_0')) ||
        (valor.match('^LAO_1')) ||
        (valor.match('^LAO_1')) ||
        (valor.match('^LAP_009_15')) ||
        (valor.match('^LAP-LAI_')) ||
        (valor.match('^LAP-LAI-LAO_')) ||
        (valor.match('^RegLAO_')) ||
        (valor.match('^RenLAO_'))) {
        var nomeArquivo = valor;
        var strHTMLifr = "<iframe id=_ifrDown name=_ifrDown width=0 height=0 border=0></iframe>";
        jQuery('#divArquivos').html(strHTMLifr);
        valor = "<a class='down' target='_ifrDown' href=downloadIfr.aspx?orig=DownloadLicencaAmbiental&arqTipo=LICENCA_AMBIENTAL&arq=Licencas_Industriais\\LA\\" + nomeArquivo + ">" + nomeArquivo + "</a>";
    };


    //se for licença ambiental LAI, habilita link para abrir de acordo com os padrões de nomenclatura dos arquivos.
    if (valor.match('^LAI_')) {
        var nomeArquivo = valor;
        var strHTMLifr = "<iframe id=_ifrDown name=_ifrDown width=0 height=0 border=0></iframe>";
        jQuery('#divArquivos').html(strHTMLifr);
        valor = "<a class='down' target='_ifrDown' href=downloadIfr.aspx?orig=DownloadLicencaAmbiental&arqTipo=LICENCA_AMBIENTAL&arq=Licencas_Ambientais\\" + nomeArquivo + ">" + nomeArquivo + "</a>";
    };

    //se for licença ambiental LAO, habilita link para abrir de acordo com os padrões de nomenclatura dos arquivos.
    if (valor.match('^LAO_')) {
        var nomeArquivo = valor;
        var strHTMLifr = "<iframe id=_ifrDown name=_ifrDown width=0 height=0 border=0></iframe>";
        jQuery('#divArquivos').html(strHTMLifr);
        valor = "<a class='down' target='_ifrDown' href=downloadIfr.aspx?orig=DownloadLicencaAmbiental&arqTipo=LICENCA_AMBIENTAL&arq=Licencas_Ambientais\\" + nomeArquivo + ">" + nomeArquivo + "</a>";
    };

    //se for licença ambiental LAP, habilita link para abrir de acordo com os padrões de nomenclatura dos arquivos.
    if (valor.match('^LAP_')) {
        var nomeArquivo = valor;
        var strHTMLifr = "<iframe id=_ifrDown name=_ifrDown width=0 height=0 border=0></iframe>";
        jQuery('#divArquivos').html(strHTMLifr);
        valor = "<a class='down' target='_ifrDown' href=downloadIfr.aspx?orig=DownloadLicencaAmbiental&arqTipo=LICENCA_AMBIENTAL&arq=Licencas_Ambientais\\" + nomeArquivo + ">" + nomeArquivo + "</a>";
    };

    //se for Extrato do TCA, habilita link para abrir de acordo com os padrões de nomenclatura dos arquivos.
    if (valor.match('^Extrato_')) {
        var nomeArquivo = valor;
        var strHTMLifr = "<iframe id=_ifrDown name=_ifrDown width=0 height=0 border=0></iframe>";
        jQuery('#divArquivos').html(strHTMLifr);
        valor = "<a class='down' target='_ifrDown' href=downloadIfr.aspx?orig=DownloadLicencaAmbiental&arqTipo=LICENCA_AMBIENTAL&arq=Extrato_TCA\\" + nomeArquivo + ">" + nomeArquivo + "</a>";
    };

    //se for Encerramento de Licença Industrial, habilita link para abrir de acordo com os padrões de nomenclatura dos arquivos.
    if (valor.match('^Encerramento_')) {
        var nomeArquivo = valor;
        var strHTMLifr = "<iframe id=_ifrDown name=_ifrDown width=0 height=0 border=0></iframe>";
        jQuery('#divArquivos').html(strHTMLifr);
        valor = "<a class='down' target='_ifrDown' href=downloadIfr.aspx?orig=DownloadLicencaAmbiental&arqTipo=LICENCA_AMBIENTAL&arq=Licencas_Industriais\\LA\\" + nomeArquivo + ">" + nomeArquivo + "</a>";
    };

    //se for imagem de drone ou helicoptero, habilita link para baixar o arquivo do NAS.
    if (valor.match('^-23.') && ((valor.endsWith('zip')) || (valor.endsWith('ZIP')))) {
        var nomeArquivo = valor;
        var strHTMLifr = "<iframe id=_ifrDown name=_ifrDown width=0 height=0 border=0></iframe>";
        jQuery('#divArquivos').html(strHTMLifr);
        valor = "<a class=down target=_ifrDown href=downloadIfr.aspx?orig=DownloadImagemDroneHelicoptero&arq=" + nomeArquivo + "&arqTipo=IMAGEM_DRONE_HELICOPTERO>Clique aqui</a>"
    }

    return valor;
}

/*********************************************************
Nome: getLayerInfo()
Objetivo: Ao selecionar a camada desejada no combo, faz a pesquisa das informações usando CQLFilter
Disparador(es): cboCamada
**********************************************************/

/*

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
                    cql_filter: "DWITHIN(" + nmGeometria + ", POINT (" + lonLatSelecao.lon + " " + lonLatSelecao.lat + ")," + precisao + ", meters)"
                },
                format: new OpenLayers.Format.GML({
                    geometryName: nmGeometria
                })
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

*/
