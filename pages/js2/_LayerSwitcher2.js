//***************************************************************************************************************************************************
//***************************************************************************************************************************************************
//Nome: carregaLayerSwicher()
//Objetivo: Lê o arquivo Json de configuração e carrega as camadas, criando também o Layer Switch para o controle destas.
//Disparador(es): init();
//***************************************************************************************************************************************************
//***************************************************************************************************************************************************
function carregaLayerSwicher() {
    var htmlDinamicoBase = "";
    var htmlDinamico = "";
    var htmlDinamicoGrupo = "";
    var htmlDinamicoItens = "";
    var htmlDinamicoTotal = "";
    //var layersBase = new Array();
    var layers = new Array();
    var indexArrayLayers = 0;
    var fatorBasesAdicionados = 0;
    var indexGrupo = 0;
    var zoomAtual = 0; //Valor default do zoom de início
    var baselayer = 'TRUE';


    //*******************************************************************************************************************************************************
    //****************************************************************** CAMADAS MAPABASE *******************************************************************
    //*******************************************************************************************************************************************************

    jQuery.getJSON('../js/LayersBase.js', function (jsonB) {
        //varre o arquivo JSON
        jQuery.each((jsonB.layersMapa), function (jsonB2) {
            //Só lê registros ativos
            if (this.ativo == 'true') {
                layers.push(eval(chamaLayerEspecifico(this.layerID, this.conexao.tipo, this.conexao.src, this.conexao.base, this.conexao.namespace, baselayer, this.legenda, this.tematico, this.tematicoLegenda, this.layerLabel, layers.length, parseInt(this.ordemExib))));

                fatorBasesAdicionados = fatorBasesAdicionados + 1;  //adiciona quantidade de layers adicionados no MapaBase para contagem a partir daí
                indexArrayLayers = layers.length - 1;
                //indexArrayLayers = this.ordemExib;

                //Monta o checkbox na DIV para cara registro
                //controla visibilidade dos checkbox de acordo com o zoom

                //cria um tooltip mostrando em que níveis de zoom será mostrado
                var tooltip = 'Zoom de vizualização: ' + (this.aparencia.zoomExib).replace('#', ',');

                //var arrayZoomExib = this.aparencia.zoomExib.split("#");
                //if ($.inArray(zoomAtual.toString(), arrayZoomExib) != -1) {
                if (this.ocultavel == 'false') {
                    htmlDinamicoBase = htmlDinamicoBase + "<div style='display:block;' id='div_" + this.layerID + "'><table><tr><td class='tdLayers'>&nbsp;&nbsp;&nbsp;<input id='" + this.layerID + "' name='chkLayers' type='checkbox' indice='" + indexArrayLayers + "' indicegrupo='G' agrupador='false' tipoControle='MB' onchange='chkChange(this)' "
                } else {
                    htmlDinamicoBase = htmlDinamicoBase + "<div style='display:none;' id='div_" + this.layerID + "'><table><tr><td class='tdLayers'>&nbsp;&nbsp;&nbsp;<input id='" + this.layerID + "' name='chkLayers' type='checkbox' indice='" + indexArrayLayers + "' indicegrupo='G' agrupador='false' tipoControle='MB' onchange='chkChange(this)' "
                }


                //Se for readOnly desabilita o chkbox e cria atributo somenteleitura
                if (this.aparencia.readOnly == 'true') {
                    htmlDinamicoBase = htmlDinamicoBase + " disabled = 'true' somenteleitura='true' ";
                } else {
                    htmlDinamicoBase = htmlDinamicoBase + " somenteleitura='false' ";
                }

                if (this.aparencia.visible == 'true') {
                    htmlDinamicoBase = htmlDinamicoBase + "checked ";
                    //Cria array com camadas que devem ser exibidas de acordo com o arquivo de configuração

                    var arrayZoomExib = this.aparencia.zoomExib.split("#");
                    if ($.inArray(zoomAtual.toString(), arrayZoomExib) != -1) {
                        layersVisiveis.push(indexArrayLayers);
                    } else {
                        layersInvisiveis.push(indexArrayLayers);
                    }

                } else {
                    layersInvisiveis.push(indexArrayLayers);
                }


                //cria atributo de ocultável ou não
                htmlDinamicoBase = htmlDinamicoBase + "ocultavel= '" + this.ocultavel + "' ";

                //cria propriedades de zoomMax e zoomMin no controle e finaliza criação
                htmlDinamicoBase = htmlDinamicoBase + " zoomExib = '" + this.aparencia.zoomExib + "' ";
                htmlDinamicoBase = htmlDinamicoBase + " indiceRotulo = ''";
                htmlDinamicoBase = htmlDinamicoBase + " zoomRotulo = '#'";
                //htmlDinamicoBase = htmlDinamicoBase + ">" + "<img src='../js/img/legenda.png' class='divLegenda' alt='legenda' tematico='true' onclick='javascript: if (this.getAttribute(\"tematico\") == \"true\"){chamaLegenda('" + this.tematicoLegenda + "')}'><label class='lblLayerSwitcherItem'>" + this.layerLabel + "</label></td></tr></table></div>";
                htmlDinamicoBase = htmlDinamicoBase + ">" + "<img src='" + this.legenda + "' class='divLegenda' alt='legenda' tematico='" + this.tematico + "' srcTematico='" + this.tematicoLegenda + "' onclick='javascript: if (this.getAttribute(\"tematico\") == \"true\"){chamaLegenda(\"" + this.tematicoLegenda + "\")}'><label class='lblLayerSwitcherItem' title='Tooltip da camada'>" + this.layerLabel + "</label></td></tr></table></div>";

            }
        });
    });


    //*******************************************************************************************************************************************************
    //****************************************************************** DEMAIS CAMADAS *********************************************************************
    //*******************************************************************************************************************************************************

    jQuery.getJSON('../js/Layers.js', function (json) {
        //varre o arquivo JSON
        jQuery.each(
            (json.layersMapa), function (json2) {
                //Só lê registros ativos
                if (this.ativo == 'true') {

                    //Cria o new layer (exceto se for apenas um agrupador)
                    if (this.agrupador == 'false') {

                        layers.push(eval(chamaLayerEspecifico(this.layerID, this.conexao.tipo, this.conexao.src, this.conexao.base, this.conexao.namespace, baselayer, this.legenda, this.tematico, this.tematicoLegenda, this.layerLabel, layers.length, parseInt(this.ordemExib) + fatorBasesAdicionados)));
                        indexArrayLayers = layers.length - 1;
                        //indexArrayLayers = parseInt(this.ordemExib) + fatorBasesAdicionados;

                        //cria um tooltip mostrando em que níveis de zoom será mostrado
                        var tooltip = 'Zoom de vizualização: ' + (this.aparencia.zoomExib).replace('#', ',');

                        //Monta o checkbox na DIV para cara registro
                        //controla visibilidade dos checkbox de acordo com o zoom

                        //var arrayZoomExib = this.aparencia.zoomExib.split("#");
                        //if ($.inArray(zoomAtual.toString(), arrayZoomExib) != -1) {
                        if (this.ocultavel == 'false') {
                            htmlDinamico = htmlDinamico + "<div style='display:block;' id='div_" + this.layerID + "'><table><tr><td class='tdLayers'>&nbsp;&nbsp;&nbsp;<input id='" + this.layerID + "' name='chkLayers' type='checkbox' indice='" + indexArrayLayers + "' indicegrupo='G' agrupador='false' tipoControle='C' onchange='chkChange(this)' "
                        } else {
                            htmlDinamico = htmlDinamico + "<div style='display:none;' id='div_" + this.layerID + "'><table><tr><td class='tdLayers'>&nbsp;&nbsp;&nbsp;<input id='" + this.layerID + "' name='chkLayers' type='checkbox' indice='" + indexArrayLayers + "' indicegrupo='G' agrupador='false' tipoControle='C' onchange='chkChange(this)' "
                        }


                        //Se for readOnly desabilita o chkbox e cria atributo somenteleitura
                        if (this.aparencia.readOnly == 'true') {
                            htmlDinamico = htmlDinamico + " disabled = 'true' somenteleitura='true' ";
                        } else {
                            htmlDinamico = htmlDinamico + " somenteleitura='false' ";
                        }

                        if (this.aparencia.visible == 'true') {
                            htmlDinamico = htmlDinamico + "checked ";
                            //Cria array com camadas que devem ser exibidas de acordo com o arquivo de configuração

                            var arrayZoomExib = this.aparencia.zoomExib.split("#");
                            if ($.inArray(zoomAtual.toString(), arrayZoomExib) != -1) {
                                layersVisiveis.push(indexArrayLayers);
                            } else {
                                layersInvisiveis.push(indexArrayLayers);
                            }

                        } else {
                            layersInvisiveis.push(indexArrayLayers);
                        }


                        //cria atributo de ocultável ou não
                        htmlDinamico = htmlDinamico + "ocultavel= '" + this.ocultavel + "' ";

                        //cria propriedades de zoomMax e zoomMin no controle
                        htmlDinamico = htmlDinamico + " zoomExib = '" + this.aparencia.zoomExib + "' ";

                        //************************************************************************
                        //Verifica se existe rótulo, cria o vetor e joga o indice dele na propriedade do checkbox do Layer associado
                        var vetorIndex = '';
                        var exibe = false;
                        if (this.rotulo.ativo == 'true') {
                            //layers.push(eval(chamaVectorEspecifico(this.transparent, this.request, this.service, this.typeName, this.featureType, this.geometryName, this.vector, this.style)));
                            layers.push(eval(chamaLayerEspecifico(this.rotulo.layerID, this.rotulo.conexao.tipo, this.rotulo.conexao.src, this.rotulo.conexao.base, this.rotulo.conexao.namespace, baselayer, this.legenda, this.tematico, this.tematicoLegenda, this.layerLabel, layers.length, parseInt(this.ordemExib) + fatorBasesAdicionados + 0.5)));
                            vetorIndex = layers.length - 1;
                            //vetorIndex = parseInt(this.ordemExib) + fatorBasesAdicionados + 0.5

                            var arrayZoomExibRot = this.rotulo.aparencia.zoomExib.split("#");
                            if ($.inArray(zoomAtual.toString(), arrayZoomExibRot) != -1) {
                                layersVisiveis.push(indexArrayLayers);
                                exibe = true;
                            } else {
                                layersInvisiveis.push(indexArrayLayers);
                            }
                        }

                        if (vetorIndex != '') {
                            htmlDinamico = htmlDinamico + " indiceRotulo='" + vetorIndex + "' ";
                            htmlDinamico = htmlDinamico + " zoomRotulo='" + this.rotulo.aparencia.zoomExib + "' ";
                            //cria o botão do rótulo
                            if (exibe == true) {
                                htmlDinamico = htmlDinamico + ">" + "<img src='../js/img/switcher-on.png' id='img_" + this.layerID + "' class='divRotulo' status='on' permitido = 'true' onclick='chaveiaRotulos(" + this.layerID + ");'><img src='" + this.legenda + "' tematico='" + this.tematico + "'srcTematico='" + this.tematicoLegenda + "' onclick='javascript: if (this.getAttribute(\"tematico\") == \"true\"){chamaLegenda(\"" + this.tematicoLegenda + "\")}' class='divLegenda' alt='legenda'><label class='lblLayerSwitcherItem' title='Tooltip da camada'>" + this.layerLabel + "</label></td></tr></table></div>";
                            } else {
                                htmlDinamico = htmlDinamico + ">" + "<img src='../js/img/switcher-off.png' id='img_" + this.layerID + "' class='divRotulo' status='off' permitido = 'false' onclick='chaveiaRotulos(" + this.layerID + ");'><img src='" + this.legenda + "' tematico='" + this.tematico + "'srcTematico='" + this.tematicoLegenda + "' onclick='javascript: if (this.getAttribute(\"tematico\") == \"true\"){chamaLegenda(\"" + this.tematicoLegenda + "\")}' class='divLegenda' alt='legenda'><label class='lblLayerSwitcherItem' title='Tooltip da camada'>" + this.layerLabel + "</label></td></tr></table></div>";
                            }
                        } else {
                            htmlDinamico = htmlDinamico + " indiceRotulo = ''";
                            htmlDinamico = htmlDinamico + " zoomRotulo = '#'";
                            htmlDinamico = htmlDinamico + ">" + "<img src='../js/img/switcher-none.png' id='img_" + this.layerID + "' class='divRotulo' status='none' permitido = 'false' onclick='chaveiaRotulos(" + this.layerID + ");'><img src='" + this.legenda + "' tematico='" + this.tematico + "'srcTematico='" + this.tematicoLegenda + "' onclick='javascript: if (this.getAttribute(\"tematico\") == \"true\"){chamaLegenda(\"" + this.tematicoLegenda + "\")}' class='divLegenda' alt='legenda'><label class='lblLayerSwitcherItem' title='Tooltip da camada'>" + this.layerLabel + "</label></td></tr></table></div>";
                        }

                        //FIM Rótulos
                        //************************************************************************

                        htmlDinamicoTotal = htmlDinamico + htmlDinamicoTotal;
                        htmlDinamico = "";
                    } else {
                        var labelAgrupador = "";

                        //Monta o checkbox na DIV para cara registro
                        indexGrupo = indexGrupo + 1;

                        //controla visibilidade dos checkbox de acordo com o zoom
                        var arrayZoomExib = this.aparencia.zoomExib.split("#");
                        //cria um tooltip mostrando em que níveis de zoom será mostrado
                        var tooltip = 'Zoom de vizualização: ' + (this.aparencia.zoomExib).replace('#', ',');

                        //if ($.inArray(zoomAtual.toString(), arrayZoomExib) != -1 && this.ocultavel == 'false') {
                        if (this.ocultavel == 'false') {
                            htmlDinamico = htmlDinamico + "<div style='display:block;' id='div_" + this.layerID + "'><table><tr><td class='tdLayers'>";
                            htmlDinamico = htmlDinamico + "<a href=\'javascript: treeControl(" + "\"" + this.layerID + "\"" + ")\'>";
                            htmlDinamico = htmlDinamico + "<img src='../js/img/plusbottom.gif' border='0' id='btnMaisMenos_" + this.layerID + "'>";
                            htmlDinamico = htmlDinamico + "</a>";
                            htmlDinamico = htmlDinamico + "<input id='" + this.layerID + "' name='chkLayers' type='checkbox' indice='G' indicegrupo='" + (indexGrupo) + "' agrupador='true' tipoControle='C' onchange='chkChange(this)' ";
                        } else {
                            htmlDinamico = htmlDinamico + "<div style='display:none;' id='div_" + this.layerID + "'><table><tr><td class='tdLayers'>";
                            htmlDinamico = htmlDinamico + "<a href=\'javascript: treeControl(" + "\"" + this.layerID + "\"" + ")\'>";
                            htmlDinamico = htmlDinamico + "<img src='../js/img/plusbottom.gif' border='0' id='btnMaisMenos_" + this.layerID + "'>";
                            htmlDinamico = htmlDinamico + "</a>";
                            htmlDinamico = htmlDinamico + "<input id='" + this.layerID + "' name='chkLayers' type='checkbox' indice='G' indicegrupo='" + (indexGrupo) + "' agrupador='true' tipoControle='C' onchange='chkChange(this)' ";
                        }


                        //cria atributo de ocultável ou não
                        htmlDinamico = htmlDinamico + "ocultavel= '" + this.ocultavel + "' ";


                        //Se for readOnly desabilita o chkbox e cria atributo somenteleitura
                        if (this.aparencia.readOnly == 'true') {
                            htmlDinamico = htmlDinamico + " disabled = 'true' somenteleitura='true' ";
                        } else {
                            htmlDinamico = htmlDinamico + " somenteleitura='false' ";
                        }

                        if (this.aparencia.visible == 'true') {
                            htmlDinamico = htmlDinamico + "checked><label class='lblLayerSwitcherItem' title='Tooltip da camada'>" + this.layerLabel + "</label></td></tr></table></div>";
                            //Cria array com camadas que devem ser exibidas de acordo com o arquivo de configuração
                            ////layersVisiveis.push(indexArrayLayers);
                        } else {
                            htmlDinamico = htmlDinamico + "><label class='lblLayerSwitcherItem' title='Tooltip da camada'>" + this.layerLabel + "</label></td></tr></table></div>";
                            //Cria array com camadas que não devem ser exibidas de acordo com o arquivo de configuração
                            ////layersInvisiveis.push(indexArrayLayers);
                        }


                        labelAgrupador = this.layerLabel;

                        //Varre todas as subcamadas deste agrupador criando os ítens e carregando os Layers
                        jQuery.each(this.subcamadas, function (json3) {

                            //Só lê registros ativos
                            if (this.ativo == 'true') {

                                layers.push(eval(chamaLayerEspecifico(this.layerID, this.conexao.tipo, this.conexao.src, this.conexao.base, this.conexao.namespace, baselayer, this.legenda, this.tematico, this.tematicoLegenda, labelAgrupador + " " + this.layerLabel, layers.length, parseInt(this.ordemExib) + fatorBasesAdicionados)));
                                indexArrayLayers = layers.length - 1;
                                //indexArrayLayers = parseInt(this.ordemExib) + fatorBasesAdicionados;

                                //controla visibilidade dos checkbox de acordo com o zoom
                                //Monta o checkbox na DIV para cara registro
                                var arrayZoomExib = this.aparencia.zoomExib.split("#");
                                //cria um tooltip mostrando em que níveis de zoom será mostrado
                                var tooltip = 'Zoom de vizualização: ' + (this.aparencia.zoomExib).replace('#', ',');

                                //if ($.inArray(zoomAtual.toString(), arrayZoomExib) != -1) {
                                if (this.ocultavel == 'false') {
                                    htmlDinamicoItens = htmlDinamicoItens + "<div style='display:block;' id='div_" + this.layerID + "'><table><tr><td class='tdLayers'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<input id='" + this.layerID + "' name='chkLayers' type='checkbox' indice='" + indexArrayLayers + "' indicegrupo='" + indexGrupo + "' agrupador='false' tipoControle='C' onchange='chkChange(this)' "
                                } else {
                                    htmlDinamicoItens = htmlDinamicoItens + "<div style='display:none;' id='div_" + this.layerID + "'><table><tr><td class='tdLayers'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<input id='" + this.layerID + "' name='chkLayers' type='checkbox' indice='" + indexArrayLayers + "' indicegrupo='" + indexGrupo + "' agrupador='false' tipoControle='C' onchange='chkChange(this)' "
                                }

                                //Se for readOnly desabilita o chkbox e cria atributo somenteleitura
                                if (this.aparencia.readOnly == 'true') {
                                    htmlDinamicoItens = htmlDinamicoItens + " disabled = 'true' somenteleitura='true' ";
                                } else {
                                    htmlDinamicoItens = htmlDinamicoItens + " somenteleitura='false' ";
                                }

                                if (this.aparencia.visible == 'true') {
                                    htmlDinamicoItens = htmlDinamicoItens + "checked ";
                                    //Cria array com camadas que devem ser exibidas de acordo com o arquivo de configuração
                                    var arrayZoomExib = this.aparencia.zoomExib.split("#");
                                    if ($.inArray(zoomAtual.toString(), arrayZoomExib) != -1) {
                                        layersVisiveis.push(indexArrayLayers);
                                    } else {
                                        layersInvisiveis.push(indexArrayLayers);
                                    }
                                } else {
                                    //Cria array com camadas que não devem ser exibidas de acordo com o arquivo de configuração
                                    layersInvisiveis.push(indexArrayLayers);
                                }

                                //cria atributo de ocultável ou não
                                htmlDinamicoItens = htmlDinamicoItens + "ocultavel= '" + this.ocultavel + "' ";

                                //cria propriedades de zoomMax e zoomMin no controle
                                htmlDinamicoItens = htmlDinamicoItens + " zoomExib = '" + this.aparencia.zoomExib + "' ";

                                //************************************************************************
                                //Verifica se existe rótulo, cria o vetor e joga o indice dele na propriedade do checkbox do Layer associado
                                var vetorIndex = '';
                                var exibe = false;

                                if (this.rotulo.ativo == 'true') {
                                    //layers.push(eval(chamaVectorEspecifico(this.transparent, this.request, this.service, this.typeName, this.featureType, this.geometryName, this.vector, this.style)));
                                    layers.push(eval(chamaLayerEspecifico(this.rotulo.layerID, this.rotulo.conexao.tipo, this.rotulo.conexao.src, this.rotulo.conexao.base, this.rotulo.conexao.namespace, baselayer, this.legenda, this.tematico, this.tematicoLegenda, labelAgrupador + " " + this.layerLabel, layers.length, parseInt(this.ordemExib) + fatorBasesAdicionados + 0.5)));
                                    vetorIndex = layers.length - 1;
                                    //vetorIndex = parseInt(this.ordemExib) + fatorBasesAdicionados + 0.5;

                                    var arrayZoomExibRot = this.rotulo.aparencia.zoomExib.split("#");
                                    if ($.inArray(zoomAtual.toString(), arrayZoomExibRot) != -1) {
                                        layersVisiveis.push(indexArrayLayers);
                                        var exibe = true;
                                    } else {
                                        layersInvisiveis.push(indexArrayLayers);
                                    }
                                }

                                if (vetorIndex != '') {
                                    htmlDinamicoItens = htmlDinamicoItens + " indiceRotulo='" + vetorIndex + "' ";
                                    htmlDinamicoItens = htmlDinamicoItens + " zoomRotulo='" + this.rotulo.aparencia.zoomExib + "' ";
                                } else {
                                    htmlDinamicoItens = htmlDinamicoItens + " indiceRotulo = ''";
                                    htmlDinamicoItens = htmlDinamicoItens + " zoomRotulo = '#'";
                                }

                                if (vetorIndex != '') {
                                    htmlDinamicoItens = htmlDinamicoItens + " indiceRotulo='" + vetorIndex + "' ";
                                    htmlDinamicoItens = htmlDinamicoItens + " zoomRotulo='" + this.rotulo.aparencia.zoomExib + "' ";
                                    //cria o botão do rótulo
                                    if (exibe == true) {
                                        htmlDinamicoItens = htmlDinamicoItens + ">" + "<img src='../js/img/switcher-on.png' id='img_" + this.layerID + "' class='divRotulo' status='on' permitido = 'true' onclick='chaveiaRotulos(" + this.layerID + ");'><img src='" + this.legenda + "' tematico='" + this.tematico + "'srcTematico='" + this.tematicoLegenda + "' onclick='javascript: if (this.getAttribute(\"tematico\") == \"true\"){chamaLegenda(\"" + this.tematicoLegenda + "\")}' class='divLegenda' alt='legenda'><label class='lblLayerSwitcherItem' title='Tooltip da camada'>" + this.layerLabel + "</label></td></tr></table></div>";
                                    } else {
                                        htmlDinamicoItens = htmlDinamicoItens + ">" + "<img src='../js/img/switcher-off.png' id='img_" + this.layerID + "' class='divRotulo' status='off' permitido = 'false' onclick='chaveiaRotulos(" + this.layerID + ");'><img src='" + this.legenda + "' tematico='" + this.tematico + "'srcTematico='" + this.tematicoLegenda + "' onclick='javascript: if (this.getAttribute(\"tematico\") == \"true\"){chamaLegenda(\"" + this.tematicoLegenda + "\")}' class='divLegenda' alt='legenda'><label class='lblLayerSwitcherItem' title='Tooltip da camada'>" + this.layerLabel + "</label></td></tr></table></div>";
                                    }
                                } else {
                                    htmlDinamicoItens = htmlDinamicoItens + " indiceRotulo = ''";
                                    htmlDinamicoItens = htmlDinamicoItens + " zoomRotulo = '#'";
                                    htmlDinamicoItens = htmlDinamicoItens + ">" + "<img src='../js/img/switcher-none.png' id='img_" + this.layerID + "' class='divRotulo' status='none' permitido = 'false' onclick='chaveiaRotulos(" + this.layerID + ");'><img src='" + this.legenda + "' tematico='" + this.tematico + "'srcTematico='" + this.tematicoLegenda + "' onclick='javascript: if (this.getAttribute(\"tematico\") == \"true\"){chamaLegenda(\"" + this.tematicoLegenda + "\")}' class='divLegenda' alt='legenda'><label class='lblLayerSwitcherItem' title='Tooltip da camada'>" + this.layerLabel + "</label></td></tr></table></div>";
                                }

                                //FIM Rótulos
                                //************************************************************************

                                htmlDinamicoGrupo = htmlDinamicoItens + htmlDinamicoGrupo;
                                htmlDinamicoItens = "";

                            }
                        });  //fim loop subcamadas


                        //monta uma div para poder esconder e mostrar os ítens do grupo
                        htmlDinamicoGrupo = '<div id = "divGp_' + this.layerID + '"  style="display: none;">' + htmlDinamicoGrupo + '</div>';

                        //concatena os htmls
                        htmlDinamicoTotal = htmlDinamico + htmlDinamicoGrupo + htmlDinamicoTotal;
                        htmlDinamico = "";
                        htmlDinamicoGrupo = "";


                    } //end if this.agrupador == 'false'
                } //fim registros ativos
                baselayer = 'FALSE';
            }
        );

        var innerTemp;

        //document.getElementById("Layers").innerHTML = '<div id="LayersWhite" style="display: none;">' + htmlDinamicoTotal + '</div>';

        //innerTemp = innerTemp + '<div id="LayersWhiteMapabase" style="display: none;">Mapabase aqui</div>';
        innerTemp = '<div id="LayersWhiteCamadas" style="display: none;"><b>' + '<img src="../js/img/minusbottom.gif" border="0" id="btnExibeInibeCamadasMapaBase" onclick="ExibeInibeCamadasMapabase();">' + '&nbsp;Mapa Base</b><div id="LSMapaBase" style="display:block;">' + htmlDinamicoBase + '</div><br><b>' + '<img src="../js/img/minusbottomdesab.gif" border="0" id="btnExibeInibeCamadas">' + '&nbsp;Camadas</b>' + htmlDinamicoTotal + '</div>';
        innerTemp = innerTemp + '<div id="LayersWhitePlus"><table><tr><td><img src="../js/img/plusbottom.gif" border="0" id="btnExibeInibeOcultaveis" onclick="ExibeInibeCamposOcultaveis();"><label id="lblExibeInibeOcultaveis" class="lblLayerSwitcher">&nbsp;&nbsp;Exibir camadas</label></td></tr></table></div>';
        document.getElementById("Layers").innerHTML = innerTemp;

        //carrega o cabeçalho
        //document.getElementById("Cabecalho").innerHTML = '<table><tr><td><img src="../css/img/cabecalhoProdam.png"  border="0" alt="Sistema de Consulta do Mapa Digital da Cidade de São Paulo - Prefeitura de São Paulo" title="Sistema de Consulta do Mapa Digital da Cidade de São Paulo" width="1024" height="74" usemap="#MapaCabecalho" /></td></tr>'
        document.getElementById("Cabecalho").innerHTML = '<table><tr><td><img src="../css/img/Header_GeoSampa_Mapa.png"  border="0" alt="Sistema de Consulta do Mapa Digital da Cidade de São Paulo - Prefeitura de São Paulo" title="Sistema de Consulta do Mapa Digital da Cidade de São Paulo" usemap="#MapaCabecalho" /></td></tr>'

        //termina o processo do OpenLayers de carregar camadas, criar toolbar, etc...

        //var layerOrdenado = new Array();
        //layerOrdenado = layers.slice(0);

        //layerOrdenado.sort(function (a, b) {
        //return a.layerOrdem < b.layerOrdem;
        //});

        // layersBase.sort(function (a, b) {
        //     return parseInt(a.layerOrdem) > parseInt(b.layerOrdem);
        // });

        layers.sort(function (a, b) {
            if (parseFloat(a.layerOrdem) > parseFloat(b.layerOrdem))
                return 1;
            if (parseFloat(a.layerOrdem) < parseFloat(b.layerOrdem))
                return -1;
            // a must be equal to b
            return 0;
        });

        //  var layerOrdenado = new Array();
        //  layerOrdenado = layersBase.concat(layers);

        MontaOpenLayers(layers);

    });


}





//***************************************************************************************************************************************************
//***************************************************************************************************************************************************
//Nome: treeControl()
//Objetivo: controla exibição dos ítens que estão dentro da tree
//***************************************************************************************************************************************************
//***************************************************************************************************************************************************
function treeControl(div) {
    //exibe ou esconde a div do grupo
    if (document.getElementById("divGp_" + div).style.display == 'none') {
        document.getElementById("divGp_" + div).style.display = 'block';
        document.getElementById("btnMaisMenos_" + div).src = '../js/img/minusbottom.gif';
    } else {
        document.getElementById("divGp_" + div).style.display = 'none';
        document.getElementById("btnMaisMenos_" + div).src = '../js/img/plusbottom.gif';
    }
}




//***************************************************************************************************************************************************
//***************************************************************************************************************************************************
//Nome: chamaLayerEspecifico()
//Objetivo: cria a chamada do Layer para carregar as camadas
//Disparador(es):carregaLayerSwicher();
//***************************************************************************************************************************************************
//***************************************************************************************************************************************************

function chamaLayerEspecifico(id, tipo, src, base, namespace, baselayer, legenda, tematico, tematicoLegenda, layerLabel, layerIndiceReal, layerOrdem, style) {
    //Capturando hashcode
    var _hc = jQuery('#hc').val();

    if (tipo == 'WMS') {

        if (baselayer == 'FALSE') {
            //return ("new OpenLayers.Layer.WMS('" + base + "', 'map.geo?hc=" + _hc + "&service=WMS&url=/', { LAYERS: '" + namespace + ":" + base + "'})");
            //////return ("new OpenLayers.Layer.WMS('" + base + "', 'map.geo?hc=" + _hc + "', { LAYERS: '" + namespace + ":" + base + "', format: 'image/png' },{ tematico: '" + tematico + "', src_tematico: '" + tematicoLegenda + "', scr_legenda: '" + legenda + "', legendaLabel: '" + layerLabel + "', layerOrdem: '" + layerOrdem + "', layerIndiceReal: '" + layerIndiceReal + "'  })");
            //return ("new OpenLayers.Layer.WMS('" + base + "', '" + src + "', { LAYERS: '" + namespace + ":" + base + "'})");

            return ("new OpenLayers.Layer.WMS('" + base + "', 'map.geo?hc=" + _hc + "', { LAYERS: '" + namespace + ":" + base + "', format: 'image/png', transparent: true},{ tematico: '" + tematico + "', src_tematico: '" + tematicoLegenda + "', scr_legenda: '" + legenda + "', legendaLabel: '" + layerLabel + "', layerOrdem: '" + layerOrdem + "', layerIndiceReal: '" + layerIndiceReal + "' , singleTile: true })");
        } else {
            //return ("new OpenLayers.Layer.WMS('" + base + "', 'map.geo?hc=" + _hc + "', { LAYERS: '" + namespace + ":" + base + "', format: 'image/png'},{ tematico: '" + tematico + "', src_tematico: '" + tematicoLegenda + "', scr_legenda: '" + legenda + "', legendaLabel: '" + layerLabel + "', layerOrdem: '" + layerOrdem + "', layerIndiceReal: '" + layerIndiceReal + "'  })"); //sem singleTile
            return ("new OpenLayers.Layer.WMS('" + base + "', 'map.geo?hc=" + _hc + "', { LAYERS: '" + namespace + ":" + base + "', format: 'image/png'},{ tematico: '" + tematico + "', src_tematico: '" + tematicoLegenda + "', scr_legenda: '" + legenda + "', legendaLabel: '" + layerLabel + "', layerOrdem: '" + layerOrdem + "', layerIndiceReal: '" + layerIndiceReal + "' , singleTile: true })");
        }


        //exemplo funcionando     new OpenLayers.Layer.WMS('distrito_municipal', 'map.geo?hc=' + $('#hc').val() + '&', { LAYERS: 'geoportal:distrito_municipal', format: 'image/png' }, { 'ABC': '123' });
    } else if (tipo == 'WMS_STYLE') {
        return ("new OpenLayers.Layer.WMS('" + base + "', 'map.geo?hc=" + _hc + "', { LAYERS: '" + namespace + ":" + base + "', format: 'image/png', transparent: true, styles: '" + style + "'},{ tematico: '" + tematico + "', src_tematico: '" + tematicoLegenda + "', scr_legenda: '" + legenda + "', legendaLabel: '" + layerLabel + "', layerOrdem: '" + layerOrdem + "', layerIndiceReal: '" + layerIndiceReal + "' , singleTile: true })");
    } else if (tipo == 'WMS_RASTER') {
        //return ("new OpenLayers.Layer.WMS('" + base + "', 'map.geo?hc=" + _hc + "&service=WMS&url=/', { LAYERS: '" + namespace + ":" + base + "'})");
        return ("new OpenLayers.Layer.WMS('" + base + "', 'map.geo?hc=" + _hc + "&service=WMS&tipoServico=WMS_RASTER', { LAYERS: '" + namespace + ":" + base + "', format: 'image/png' },{ tematico: '" + tematico + "', src_tematico: '" + tematicoLegenda + "', scr_legenda: '" + legenda + "', legendaLabel: '" + layerLabel + "', layerOrdem: '" + layerOrdem + "', layerIndiceReal: '" + layerIndiceReal + "'  })");
        //return ("new OpenLayers.Layer.WMS('" + base + "', '" + src + "', { LAYERS: '" + namespace + ":" + base + "'})");


        //exemplo funcionando     new OpenLayers.Layer.WMS('distrito_municipal', 'map.geo?hc=' + $('#hc').val() + '&', { LAYERS: 'geoportal:distrito_municipal', format: 'image/png' }, { 'ABC': '123' });
    } else if (tipo == 'TMS') {
        if (baselayer == 'TRUE') {
            return ("new OpenLayers.Layer.TMS('" + base + "', 'map.geo?hc=" + _hc + "&service=TMS&url=/', { layername: '" + base + "', type: 'png', tematico: '" + tematico + "', src_tematico: '" + tematicoLegenda + "', scr_legenda: '" + legenda + "', legendaLabel: '" + layerLabel + "', layerOrdem: '" + layerOrdem + "', layerIndiceReal: '" + layerIndiceReal + "' }, { isBaseLayer: true})");
        } else {
            return ("new OpenLayers.Layer.TMS('" + base + "', 'map.geo?hc=" + _hc + "&service=TMS&url=/', { layername: '" + base + "', type: 'png', tematico: '" + tematico + "', src_tematico: '" + tematicoLegenda + "', scr_legenda: '" + legenda + "', legendaLabel: '" + layerLabel + "', layerOrdem: '" + layerOrdem + "', layerIndiceReal: '" + layerIndiceReal + "' })");
        }
    } else if (tipo == 'WMS_EXTERNO') {
        return ("new OpenLayers.Layer.WMS('" + base + "', 'map.geo?hc=" + _hc + "&service=WMS&tipoServico=WMS_EXTERNO', { LAYERS: '" + base + "', format: 'image/png', transparent: true},{ tematico: '" + tematico + "', src_tematico: '" + tematicoLegenda + "', scr_legenda: '" + legenda + "', legendaLabel: '" + layerLabel + "', layerOrdem: '" + layerOrdem + "', layerIndiceReal: '" + layerIndiceReal + "' , singleTile: true })");
    } else if (tipo == 'WMS_EXTERNO_HABITASAMPA') {
        return ("new OpenLayers.Layer.WMS('" + base + "', 'map.geo?hc=" + _hc + "&service=WMS&tipoServico=WMS_EXTERNO_HABITASAMPA', { LAYERS: '" + base + "', format: 'image/png', transparent: true},{ tematico: '" + tematico + "', src_tematico: '" + tematicoLegenda + "', scr_legenda: '" + legenda + "', legendaLabel: '" + layerLabel + "', layerOrdem: '" + layerOrdem + "', layerIndiceReal: '" + layerIndiceReal + "' , singleTile: true })");
    } else if (tipo == 'WMS_EXTERNO_GEOAMBIENTAL') {
        return ("new OpenLayers.Layer.WMS('" + base + "', 'map.geo?hc=" + _hc + "&service=WMS&tipoServico=WMS_EXTERNO_GEOAMBIENTAL', { LAYERS: '" + base + "', format: 'image/png', transparent: true},{ tematico: '" + tematico + "', src_tematico: '" + tematicoLegenda + "', scr_legenda: '" + legenda + "', legendaLabel: '" + layerLabel + "', layerOrdem: '" + layerOrdem + "', layerIndiceReal: '" + layerIndiceReal + "' , singleTile: true })");
    } else if (tipo == 'WMS_EXTERNO_GEOPATRI') {
        return ("new OpenLayers.Layer.WMS('" + base + "', 'map.geo?hc=" + _hc + "&service=WMS&tipoServico=WMS_EXTERNO_GEOPATRI', { LAYERS: '" + base + "', format: 'image/png', transparent: true},{ tematico: '" + tematico + "', src_tematico: '" + tematicoLegenda + "', scr_legenda: '" + legenda + "', legendaLabel: '" + layerLabel + "', layerOrdem: '" + layerOrdem + "', layerIndiceReal: '" + layerIndiceReal + "' , singleTile: true })");
    } else if (tipo == 'WMS_EXTERNO_PARCELAMENTO') {
        return ("new OpenLayers.Layer.WMS('" + base + "', 'map.geo?hc=" + _hc + "&service=WMS&tipoServico=WMS_EXTERNO_PARCELAMENTO', { LAYERS: '" + base + "', format: 'image/png', transparent: true},{ tematico: '" + tematico + "', src_tematico: '" + tematicoLegenda + "', scr_legenda: '" + legenda + "', legendaLabel: '" + layerLabel + "', layerOrdem: '" + layerOrdem + "', layerIndiceReal: '" + layerIndiceReal + "' , singleTile: true })");
    } else if (tipo == 'WMS_EXTERNO_IDESP') {
        return ("new OpenLayers.Layer.WMS('" + base + "', 'map.geo?hc=" + _hc + "&service=WMS&tipoServico=WMS_EXTERNO_IDESP', { LAYERS: '" + base + "', format: 'image/png', transparent: true},{ tematico: '" + tematico + "', src_tematico: '" + tematicoLegenda + "', scr_legenda: '" + legenda + "', legendaLabel: '" + layerLabel + "', layerOrdem: '" + layerOrdem + "', layerIndiceReal: '" + layerIndiceReal + "' , singleTile: true })");
    }
}




//***************************************************************************************************************************************************
//***************************************************************************************************************************************************
//Nome: chamaVectorEspecifico()
//Objetivo: cria a chamada do Layer para carregar os vetores de rótulos
//Disparador(es):carregaLayerSwicher();
//***************************************************************************************************************************************************
//***************************************************************************************************************************************************
function chamaVectorEspecifico(transparent, request, service, typeName, featureType, geometryName, vector, style) {
    //Capturando hashcode
    var _hc = jQuery('#hc').val();

    var vector;
    var varStyle;
    //Rotulos

    varStyle = "label: '" + style[0].label + "', fontColor: '" + style[0].fontColor + "', fontSize: '" + style[0].fontSize + "', fontFamily: '" + style[0].fontFamily + "', fontStyle: '" + style[0].fontStyle + "', fontWeight: '" + style[0].fontWeight + "', labelOutlineColor: '" + style[0].labelOutlineColor + "', labelOutlineWidth: '" + style[0].labelOutlineWidth + "'";
    vector = "new OpenLayers.Layer.Vector('" + vector + "', {" + "strategies: [new OpenLayers.Strategy.Fixed()]," + "protocol: new OpenLayers.Protocol.HTTP(" + "{url: 'map.geo?hc=" + _hc + "',transparent: '" + transparent + "' ,params: {request: '" + request + "',service: '" + service + "',version: '1.0.0',typeName: '" + typeName + "',featureType: '" + featureType + "'},format: new OpenLayers.Format.GML({geometryName: '" + geometryName + "'})}" + ")," + "styleMap: new OpenLayers.StyleMap({ 'default': {" + varStyle + "}})})";

    return vector;
}


//***************************************************************************************************************************************************
//***************************************************************************************************************************************************
//Nome: ajustaVisibilidadeCamadas()
//Objetivo: Varre os arrays de layes visíveis e invisíveis, criados na leitura do Json de config., setando a visibilidade
//Disparador(es): MontaOpenLayers();
//***************************************************************************************************************************************************
//***************************************************************************************************************************************************
function ajustaVisibilidadeCamadas() {






    for (var i = 0; i < layersVisiveis.length; i++) {
        for (var j = 0; j < layersCargaInicialMapa.length; j++) {
            if (layersVisiveis[i] == layersCargaInicialMapa[j]) {
                map.getLayersBy('layerIndiceReal', layersVisiveis[i])[0].setVisibility(true);
            }
        }
    }



    for (var i = 0; i < layersInvisiveis.length; i++) {
        for (var j = 0; j < layersCargaInicialMapa.length; j++) {
            if (layersInvisiveis[i] == layersCargaInicialMapa[j]) {
                map.getLayersBy('layerIndiceReal', layersInvisiveis[i])[0].setVisibility(false);
            }
        }
    }




    //map.layers[layersVisiveis[10]].setVisibility(true);
    //map.layers[layersVisiveis[1]].setVisibility(true);
}


//***************************************************************************************************************************************************
//***************************************************************************************************************************************************
//Nome: ControlaCamadas()
//Objetivo: Controla as camadas pelo Layer Switch
//Disparador(es): chkChange() (função do checkBox do Layer Switch)
//***************************************************************************************************************************************************
//***************************************************************************************************************************************************
//function ControlaCamadasB(camada, visibilidade, idarray, indiceGrupoPai, agrupador, tipoControle) {
//    var indiceRotulo;
//    //var zoomAtual = map.getZoom();
//    var zoomAtual = Math.round(map.getZoom()) //Necessário para funcionar o fractionalZoom = true
//    //var tipoControle = 'MB';  //para testes

//    //Se o controle for do tipo MapaBase, deve desabilitar todos os outros controles do mesmo tipo MB pois somente um é permitido por vez
//    if (tipoControle == 'MB') {
//        map.getLayersBy('layerIndiceReal', idarray)[0].setVisibility(visibilidade);

//        var chkMB = document.getElementsByName("chkLayers")
//        var id;
//        for (var i = 0; i < chkMB.length; i++) {
//            if (chkMB.item(i).getAttribute('tipoControle') == 'MB' & camada !== chkMB[i].id) {
//                map.getLayersBy('layerIndiceReal', chkMB.item(i).getAttribute('indice'))[0].setVisibility(false);
//                //map.layers[chkMB.item(i).getAttribute('indice')].setVisibility(false);
//                chkMB[i].checked = false;
//            }
//        }
//    } else {

//        if (agrupador == 'true') {
//            //busca todos os chkbox que tem o indiceGrupo = indiceGrupoPai
//            var arrayChk = document.getElementsByName("chkLayers");
//            var indiceGrupo;
//            var indiceFilho;
//            var statuChecadoFilho;
//            var somenteleitura;
//            var contemZoomAtual = false;

//            for (var i = 0; i < arrayChk.length; i++) {
//                //pega atributos do controle
//                indiceGrupo = eval(arrayChk)[i].getAttribute('indicegrupo');
//                indiceFilho = eval(arrayChk)[i].getAttribute('indice');
//                statuChecadoFilho = eval(arrayChk)[i].checked;
//                somenteleitura = eval(arrayChk)[i].getAttribute('somenteleitura');

//                //se pertence ao grupo que está sendo desabilitado
//                if (indiceGrupo == indiceGrupoPai) {

//                    //Se nao for o proprio agrupador
//                    if (eval(arrayChk)[i].getAttribute('agrupador') == "false") {

//                        //seta visibilidade da camada filho somente se o chkbox dele estiver checado e se deve ser exibido nesse nível de zoom
//                        contemZoomAtual = ($.inArray(zoomAtual.toString(), eval(arrayChk)[i].getAttribute('zoomExib').split("#")) != -1);

//                        //if (statuChecadoFilho == true) {

//                        if (contemZoomAtual) {
//                            //map.layers[indiceFilho].setVisibility(visibilidade);
//                            map.getLayersBy('layerIndiceReal', indiceFilho)[0].setVisibility(visibilidade);
//                            //marca ou desmarca o controle
//                            eval(arrayChk)[i].checked = visibilidade;

//                            //se tiver rotulos associados, também seta a visibilidade deles
//                            indiceRotulo = eval(arrayChk)[i].getAttribute('indiceRotulo');
//                            //indicesRotulos = eval(arrayChk)[i].getAttribute('indicesrotulos');
//                            //arrayIndicesRotulos = indicesRotulos.split("#");

//                            if (indiceRotulo != '') {
//                                if (visibilidade == true) {
//                                    //se o rotulo estiver marcado e for permitido nesse nivel de zoom, deve mudar a visibilidade da camada
//                                    var subcamada = eval(arrayChk)[i].getAttribute('id');
//                                    //if (document.getElementById("img_" + camada).getAttribute('status') == 'on' && document.getElementById("img_" + camada).getAttribute('permitido') == 'true') {
//                                    if (document.getElementById("img_" + subcamada).getAttribute('status') == 'on' && document.getElementById("img_" + subcamada).getAttribute('permitido') == 'true') {
//                                        //map.layers[parseInt(indiceRotulo)].setVisibility(true);
//                                        map.getLayersBy('layerIndiceReal', parseInt(indiceRotulo))[0].setVisibility(true);

//                                        //quando ativa o rótulo, desativa a camada do mapa
//                                        //map.layers[parseInt(idarray)].setVisibility(false);
//                                        map.getLayersBy('layerIndiceReal', parseInt(indiceFilho))[0].setVisibility(false);
//                                    }
//                                } else {
//                                    //map.layers[parseInt(indiceRotulo)].setVisibility(false);
//                                    map.getLayersBy('layerIndiceReal', parseInt(indiceRotulo))[0].setVisibility(false);
//                                }
//                            }
//                        } else {
//                            //marca ou desmarca o controle mesmo que não seja visualizado nesse nível de zoom
//                            eval(arrayChk)[i].checked = visibilidade;
//                        }

//                        //}

//                        //habilita ou desabilita controle (somente se nao for somenteleitura)
//                        /*if (somenteleitura == 'false') {
//                        if (visibilidade == true && contemZoomAtual) {
//                        eval(arrayChk)[i].disabled = false;
//                        } else {
//                        eval(arrayChk)[i].disabled = true;
//                        }
//                        }*/


//                    }
//                }
//            } //end for
//        } else {

//            map.getLayersBy('layerIndiceReal', idarray)[0].setVisibility(visibilidade);
//            // map.layers[idarray].setVisibility(visibilidade);

//            //se tiver rotulos associados, também seta a visibilidade deles
//            indiceRotulo = document.getElementById(camada).getAttribute('indiceRotulo');
//            //indicesRotulos = document.getElementById(camada).getAttribute('indicesrotulos');
//            //arrayIndicesRotulos = indicesRotulos.split("#");

//            if (indiceRotulo != '') {

//                if (visibilidade == true) {
//                    //se o rotulo estiver marcado e for permitido nesse nivel de zoom, deve mudar a visibilidade da camada
//                    if (document.getElementById("img_" + camada).getAttribute('status') == 'on' && document.getElementById("img_" + camada).getAttribute('permitido') == 'true') {
//                        map.getLayersBy('layerIndiceReal', parseInt(indiceRotulo))[0].setVisibility(true);
//                        //map.layers[parseInt(indiceRotulo)].setVisibility(true);

//                        //quando ativa o rótulo, desativa a camada do mapa
//                        map.getLayersBy('layerIndiceReal', parseInt(idarray))[0].setVisibility(false);
//                        //map.layers[parseInt(idarray)].setVisibility(false);
//                    }
//                } else {
//                    map.getLayersBy('layerIndiceReal', parseInt(indiceRotulo))[0].setVisibility(false);
//                    //map.layers[parseInt(indiceRotulo)].setVisibility(false);
//                }
//            }


//            //varre todos os outros ítens do grupo (caso pertença à um grupo). Se todos estiverem marcados, marca o pai do grupo, se todos estiverem desmarcados, desmarca o pai do grupo
//            var arrayChk = document.getElementsByName("chkLayers");
//            var indiceGrupo;
//            var indiceItem;
//            var contadorMarcados = 0;
//            var contadorDesmarcados = 0;
//            var contadorTotal = 0;
//            var statuChecadoItem;

//            for (var i = 0; i < arrayChk.length; i++) {
//                //pega atributos do controle
//                indiceGrupo = eval(arrayChk)[i].getAttribute('indicegrupo');
//                indiceItem = eval(arrayChk)[i].getAttribute('indice');
//                IndiceAgrupador = eval(arrayChk)[i].getAttribute('agrupador');
//                statuChecadoItem = eval(arrayChk)[i].checked;

//                //Se pertence ao mesmo grupo
//                if (indiceGrupo == indiceGrupoPai) {

//                    if (IndiceAgrupador == "true") {
//                        //guarda o índice do pai para poder marcar ou desmarcar
//                        IndicePai = i;
//                    } else {

//                        if (statuChecadoItem == true) {
//                            contadorMarcados = contadorMarcados + 1;
//                            contadorTotal = contadorTotal + 1;
//                        } else {
//                            contadorDesmarcados = contadorDesmarcados + 1;
//                            contadorTotal = contadorTotal + 1;
//                        }
//                    }
//                }
//            } //end for


//            if (contadorMarcados == contadorTotal) {
//                eval(arrayChk)[IndicePai].checked = true;
//            } else {
//                eval(arrayChk)[IndicePai].checked = false;
//            }
//        } //endif agrupador

//    } //fim tipo MB

//} //function

//***************************************************************************************************************************************************
//***************************************************************************************************************************************************
//Nome: chaveiaRotulos()
//Objetivo: Exibe ou inibe o rótulo quando clicado no ícone dentro do layerSwitcher
//Disparador(es):
//***************************************************************************************************************************************************
//***************************************************************************************************************************************************
function chaveiaRotulos(obj) {

    //se status do rotulo <> none (rotulo nao ativo) e se permitido <> false (não permitido nesse nível de zoom)
    if (document.getElementById("img_" + obj.getAttribute('id')).getAttribute('status') != 'none' && document.getElementById("img_" + obj.getAttribute('id')).getAttribute('permitido') != 'false') {
        if (obj.checked == true) {

            var indiceRotulo = obj.getAttribute('indiceRotulo');
            var indice = obj.getAttribute('indice');
            //var indicesRotulos = obj.getAttribute('indicesrotulos');
            //var arrayIndicesRotulos = indicesRotulos.split("#");
            var arrayZoomExib;
            //var zoomAtual = map.getZoom();
            var zoomAtual = Math.round(map.getZoom()) //Necessário para funcionar o fractionalZoom = true
            var exibeIcon = false;

            arrayZoomExib = obj.getAttribute('zoomExib');
            arrayZoomExib = arrayZoomExib.split("#");

            if ($.inArray(zoomAtual.toString(), arrayZoomExib) != -1) {
                //for (var i = 0; i < arrayIndicesRotulos.length - 1; i++) {

                /*if (indiceRotulo != "") {
                if (map.layers[indiceRotulo].visibility == true) {
                map.layers[indiceRotulo].setVisibility(false);
                map.layers[indice].setVisibility(true);  // 05/03/2014 - Agora desabilita a camada quando habilita o rótulo, e vice-versa
                } else {
                map.layers[indiceRotulo].setVisibility(true);
                map.layers[indice].setVisibility(false);  // 05/03/2014 - Agora desabilita a camada quando habilita o rótulo, e vice-versa
                exibeIcon = true;
                }
                }*/
                //agora com layerindiceReal
                if (indiceRotulo != "") {



                    if (map.getLayersBy('layerIndiceReal', parseInt(indiceRotulo))[0] == undefined) {

                        for (var i = 0; i < layers.length; i++) {
                            if (layers[i].layerIndiceReal == parseInt(indiceRotulo)) {
                                map.addLayers([layers[i]]);
                                layersCargaInicialMapa.push(parseInt(indiceRotulo));
                            }
                        }

                    }

                    if (map.getLayersBy('layerIndiceReal', indiceRotulo)[0].visibility == true) {
                        map.getLayersBy('layerIndiceReal', indiceRotulo)[0].setVisibility(false);
                        map.getLayersBy('layerIndiceReal', indice)[0].setVisibility(true);  // 05/03/2014 - Agora desabilita a camada quando habilita o rótulo, e vice-versa
                    } else {
                        map.getLayersBy('layerIndiceReal', indiceRotulo)[0].setVisibility(true);
                        map.getLayersBy('layerIndiceReal', indice)[0].setVisibility(false);  // 05/03/2014 - Agora desabilita a camada quando habilita o rótulo, e vice-versa
                        exibeIcon = true;
                    }
                }

                //}

                //verifica se deve exibir o icone de rótulo habilitado ou desabilitado
                if (exibeIcon == true) {
                    document.getElementById("img_" + obj.getAttribute('id')).src = "../js/img/switcher-on.png";
                    document.getElementById("img_" + obj.getAttribute('id')).setAttribute('status', 'on');
                } else {
                    document.getElementById("img_" + obj.getAttribute('id')).src = "../js/img/switcher-off.png";
                    document.getElementById("img_" + obj.getAttribute('id')).setAttribute('status', 'off');
                }
            }
        }

    }

}


//***************************************************************************************************************************************************
//***************************************************************************************************************************************************
//Nome: ExibeInibeCamposOcultaveis()
//Objetivo: Exibe ou inibe os campos setados como ocultaveis = true no arquivo de configuração JSON
//Disparador(es):
//***************************************************************************************************************************************************
//***************************************************************************************************************************************************
function ExibeInibeCamposOcultaveis() {
    //varre todos os chks e verifica os ocultaveis, exibindo ou inibindo a div correspondente
    var chk = document.getElementsByName("chkLayers")
    var id;
    var conta_ocultavel = 0;
    for (var i = 0; i < chk.length; i++) {
        if (chk.item(i).getAttribute('ocultavel') == 'true') {
            id = chk.item(i).getAttribute('id');
            id = "div_" + id;
            conta_ocultavel = conta_ocultavel + 1;
            if (document.getElementById(id).style.display == 'block') {
                document.getElementById(id).style.display = 'none';
                document.getElementById('btnExibeInibeOcultaveis').src = "../js/img/plusbottom.gif";
                document.getElementById('lblExibeInibeOcultaveis').innerHTML = '&nbsp;&nbsp;Exibir camadas';
            } else {
                document.getElementById(id).style.display = 'block';
                document.getElementById('btnExibeInibeOcultaveis').src = "../js/img/minusbottom.gif";
                document.getElementById('lblExibeInibeOcultaveis').innerHTML = '&nbsp;&nbsp;Ocultar camadas';
            }

        }
    };

    if (conta_ocultavel == 0) {
        alert('Não existem camadas ocultáveis');
    }

}


//***************************************************************************************************************************************************
//***************************************************************************************************************************************************
//Nome: ExibeInibeCamadasMapabase()
//Objetivo: Exibe ou inibe os controles dos MapaBase no LS
//Disparador(es):
//***************************************************************************************************************************************************
//***************************************************************************************************************************************************
function ExibeInibeCamadasMapabase() {
    if (document.getElementById('LSMapaBase').style.display == 'block') {
        document.getElementById('LSMapaBase').style.display = 'none';
        document.getElementById('btnExibeInibeCamadasMapaBase').src = "../js/img/plusbottom.gif";
    } else {
        document.getElementById('LSMapaBase').style.display = 'block';
        document.getElementById('btnExibeInibeCamadasMapaBase').src = "../js/img/minusbottom.gif";
    }

}


//***************************************************************************************************************************************************
//***************************************************************************************************************************************************
//Nome: alternaDropdown()
//Objetivo: Aplica interação ao dropdown menu de download no LS
//Disparador(es): _LayerSwitcher3.js
//***************************************************************************************************************************************************
//***************************************************************************************************************************************************

function alternaDropdown(event, layerID) {
    console.warn("alternaDropdown");
    const dropdown = document.getElementById('dropdown_' + layerID.id);

    // Verifica se o dropdown está visível
    const isVisible = dropdown.style.display === 'block';

    // Fecha todos os dropdowns antes de abrir o atual
    fecharDropdowns();

    // Exibe ou esconde o dropdown com animação suave
    dropdown.style.display = isVisible ? 'none' : 'block';

    // Ajusta a posição do dropdown para ser exibido à esquerda do clique
    let offsetX = event.clientX;
    let screenWidth = window.innerWidth;

    // Ajusta a posição do dropdown para a esquerda do ponto clicado. 50 é a laergura do dropdown
    dropdown.style.right = `${screenWidth - offsetX - 50}px`;  // Subtrai a largura do dropdown para colocá-lo à esquerda

    // Aplica animação de fade-in quando o dropdown for aberto
    if (!isVisible) {
        dropdown.style.opacity = 0;
        AplicaFadeIn(dropdown);
    }

    // Adiciona um listener para fechar o dropdown se o usuário clicar fora dele
    document.addEventListener('click', function closeDropdown(event) {
        // Verifica se o clique foi fora do dropdown e do botão que ativou o dropdown
        if (!dropdown.contains(event.target) && !layerID.contains(event.target)) {
            dropdown.style.display = 'none';  // Fecha o dropdown
            document.removeEventListener('click', closeDropdown);  // Remove o evento de clique para evitar múltiplas execuções
        }
    });

    // Impede que o clique no botão de dropdown seja propagado para o documento
    event.stopPropagation();

    // Adiciona evento de clique dentro do dropdown para fechá-lo
    dropdown.addEventListener('click', function (event) {
        // Fecha o dropdown quando o usuário clicar dentro dele
        dropdown.style.display = 'none';
    });
}

//***************************************************************************************************************************************************
//***************************************************************************************************************************************************
//Nome: AplicaFadeIn()
//Objetivo: Aplica visualização gradual dropdown menu de download no LS
//Disparador(es): alternaDropdown
//***************************************************************************************************************************************************
//***************************************************************************************************************************************************
function AplicaFadeIn(element) {
    let opacity = 0;
    element.style.transition = "opacity 0.15s"; // Transição mais rápida
    let fadeInterval = setInterval(function () {
        if (opacity >= 1) {
            clearInterval(fadeInterval);
        }
        element.style.opacity = opacity;
        opacity += 0.2; // Aumento mais rápido da opacidade
    }, 20); // Intervalo menor para acelerar a transição
}


//***************************************************************************************************************************************************
//***************************************************************************************************************************************************
//Nome: fecharDropdowns()
//Objetivo: Fecha os dropdowns menu de download no LS
//Disparador(es): alternaDropdown
//***************************************************************************************************************************************************
//***************************************************************************************************************************************************
function fecharDropdowns() {
    const dropdowns = document.querySelectorAll('.dropdown-menu');
    dropdowns.forEach(dropdown => {
        dropdown.style.display = 'none';
    });
}

//***************************************************************************************************************************************************
//***************************************************************************************************************************************************
//Nome: downloadArquivo()
//Objetivo: Realiza o download a partir do dropdown menu de download no LS
//Disparador(es): _LayerSwitcher3.js
//***************************************************************************************************************************************************
//***************************************************************************************************************************************************
function downloadArquivo(nmCamada, tipoArquivo, tipoServico) {
    // Verifica e ajusta o tipo de serviço
    const tiposValidos = ['WFS_EXTERNO_GEOAMBIENTAL', 'WFS_EXTERNO_GEOPATRI', 'WFS_EXTERNO', 'WFS_EXTERNO_HABITASAMPA', 'WFS_EXTERNO_PARCELAMENTO'];
    if (!tiposValidos.includes(tipoServico)) {
        tipoServico = 'DWFS1';
    }

    // Obtém o hash code da sessão
    var _hc = jQuery('#hc', window.parent.document).val();

    // Configura a chamada do GEOSERVER
    const geoServerUrl = 'map.geo';

    // Define a extensão do arquivo com base no tipo
    let extensao = 'zip'; // Padrão para SHAPE-ZIP
    if (tipoArquivo === 'application%2Fvnd.google-earth.kml%2Bxml') {
        extensao = 'kml';
    } else if (tipoArquivo === 'application%2Fjson') {
        extensao = 'geojson';
    } else if (tipoArquivo === 'application%2Fx-gpkg') {
        extensao = 'gpkg';
    }

    // Montar a URL de requisição para download
    let url = `${geoServerUrl}?hc=${encodeURIComponent(_hc || '')}` +
        `&tipoServico=${encodeURIComponent(tipoServico)}` +
        `&service=WFS` +
        `&version=1.0.0` +
        `&request=GetFeature` +
        `&typeName=${encodeURIComponent(nmCamada)}` +
        `&outputFormat=${tipoArquivo}`;

    if (tipoArquivo === 'shape-zip') {
        url += `&format_options=${encodeURIComponent('CHARSET:UTF-8')}`;
    }
    console.warn("codigo novo ");

    // Exibir GIF de loading
    loading();

    // Fazer o download usando fetch
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error("Erro ao baixar o arquivo.");
            }
            return response.blob();
        })
        .then(blob => {
            // Criar um link de download dinâmico
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = `${nmCamada}.${extensao}`;

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Remover o GIF de loading quando o download for concluído
            closeloading();
        })
        .catch(error => {
            console.error("Erro no download:", error);
            alert("Falha ao baixar o arquivo.");
            closeloading();
        });
}


//***************************************************************************************************************************************************
//***************************************************************************************************************************************************
//Nome: chamarMetadados()
//Objetivo: Realiza o download a partir do dropdown menu de download no LS
//Disparador(es): _LayerSwitcher3.js
//***************************************************************************************************************************************************
//***************************************************************************************************************************************************

function chamarMetadados(idMetadado) {
    if (idMetadado.trim() === '') {
        console.log('O id do metadado não foi informado.');
        return;
    }

    var url = `https://metadados.geosampa.prefeitura.sp.gov.br/geonetwork/srv/por/catalog.search#/metadata/${idMetadado}`;
    window.open(url, '_blank');
}





//***************************************************************************************************************************************************
//***************************************************************************************************************************************************
//Nome: chamaLegenda()
//Objetivo: Chama div de legenda temática
//Disparador(es):
//***************************************************************************************************************************************************
//***************************************************************************************************************************************************

function chamaLegenda(imgLegenda) {
    var divLegendas = document.getElementById("Legendas");



    var htmlDinamicoLeg = "<div id='divLegendas'>";
    var htmlDinamicoLeg = htmlDinamicoLeg + "<table  width='100%'>";
    var htmlDinamicoLeg = htmlDinamicoLeg + "<tr><td style='font-size: 12px;' align='left'><b>Legenda</b></td><td align='right'><img src='../js/img/close_div.png' alt='Fechar legenda' onclick=\"document.getElementById('Legendas').style.display = 'none'\"></td></tr>";
    var htmlDinamicoLeg = htmlDinamicoLeg + "<tr><td></td></tr>";
    ////var htmlDinamicoLeg = htmlDinamicoLeg + "<tr><td colspan=2><img src='../css/img/legendas/legendas_tematico_zona_uso.png' class='divLegendaTematica' alt='legenda'>";


    /////////var htmlDinamicoLeg = htmlDinamicoLeg + "<tr><td colspan=2><img src='../css/img/legendas/" + imgLegenda + "' class='divLegendaTematica' alt='legenda'>";
    var htmlDinamicoLeg = htmlDinamicoLeg + "<tr><td colspan=2><img src='" + imgLegenda + "' class='divLegendaTematica' alt='legenda'>";

    //var htmlDinamicoLeg = htmlDinamicoLeg + "<tr><td colspan=2><img src='../js/img/legenda.png' class='divLegenda' alt='legenda'><label class='lblLayerSwitcherItem'> legenda 1</label></td></tr>";
    //var htmlDinamicoLeg = htmlDinamicoLeg + "<tr><td colspan=2><img src='../js/img/legenda.png' class='divLegenda' alt='legenda'><label class='lblLayerSwitcherItem'> legenda 2</label></td></tr>";
    //var htmlDinamicoLeg = htmlDinamicoLeg + "<tr><td colspan=2><img src='../js/img/legenda.png' class='divLegenda' alt='legenda'><label class='lblLayerSwitcherItem'> legenda 3</label></td></tr>";
    var htmlDinamicoLeg = htmlDinamicoLeg + "</table>";
    var htmlDinamicoLeg = htmlDinamicoLeg + "</div>";

    divLegendas.innerHTML = htmlDinamicoLeg;
    divLegendas.style.display = 'block';
}


//***************************************************************************************************************************************************
//***************************************************************************************************************************************************
//Nome: HabDesItemLS()
//Objetivo: Funcao que Habilita ou desabilita a linha toda do layer switcher (LS) em camadas que não podem ser exibidas no nível de zoom corrente
//Disparador(es):
//***************************************************************************************************************************************************
//***************************************************************************************************************************************************
function HabDesItemLS(chk, chave) {

    if (chave == 'on') {
        //chk.style.display = "block";
        //habilita todos os inputs da div
        var elInput = chk.getElementsByTagName("input");
        for (i = 0; i < elInput.length; i++) {
            elInput[i].disabled = false;
        }

        //troca o css do label
        var elLabel = chk.getElementsByTagName("label");
        for (i = 0; i < elLabel.length; i++) {
            elLabel[i].className = "lblLayerSwitcherItem";
            //elLabel[i].disabled = false;
        }
    } else {
        //chk.style.display = "block";  //none
        //desabilita todos os inputs da div
        var elInput = chk.getElementsByTagName("input");
        for (i = 0; i < elInput.length; i++) {
            elInput[i].disabled = true;
        }

        //troca o css do label
        var elLabel = chk.getElementsByTagName("label");
        for (i = 0; i < elLabel.length; i++) {
            elLabel[i].className = "lblLayerSwitcherItemDesat";
            //elLabel[i].disabled = true;
        }
    }
}

//***************************************************************************************************************************************************
//***************************************************************************************************************************************************
//Nome: zoomChangeLayerSwitcher()
//Objetivo: Controla as camadas de acordo com o zoom que foi alterado
//Disparador(es): zoomChanged
//***************************************************************************************************************************************************
//***************************************************************************************************************************************************
function zoomChangeLayerSwitcherB(zoom) {
    //varre o arquivo de configuração JSON para inibir os desinibir camadas
    var divChkBox;
    var chkBox;
    var divChkBoxSub;
    var chkBoxSub;
    var visibilidade;

    jQuery.getJSON('../js/Layers.js', function (json3) {
        //varre o arquivo JSON
        jQuery.each(
            json3.layersMapa, function (json4) {
                if (this.ativo == 'true') {
                    divChkBox = document.getElementById("div_" + this.layerID);
                    chkBox = document.getElementById(this.layerID);

                    //controla visibilidade da div que contém o checkBox, e com o índice salvo no atributo dele controla a visibilidade da camada correspondente


                    //como verificar se deve ser mostrado no zoom atual
                    var arrayZoomExib = this.aparencia.zoomExib.split("#");
                    if ($.inArray(zoom.toString(), arrayZoomExib) != -1) {
                        //if (this.aparencia.zoomMin <= zoom && zoom <= this.aparencia.zoomMax) {
                        ////divChkBox.style.display = "block";
                        HabDesItemLS(divChkBox, 'on');

                        //se o checkBox tem índice <> 'G' (Ítem agrupador)
                        if (chkBox.getAttribute('indice') != 'G') {
                            //se o checkBox está checado ou não
                            if (chkBox.checked == true) {
                                map.getLayersBy('layerIndiceReal', chkBox.getAttribute('indice'))[0].setVisibility(true);
                                visibilidade = true;
                            } else {
                                map.getLayersBy('layerIndiceReal', chkBox.getAttribute('indice'))[0].setVisibility(false);
                                visibilidade = false;
                            }
                        }

                    } else {
                        ////divChkBox.style.display = "none";
                        HabDesItemLS(divChkBox, 'off');

                        //se o checkBox tem índice <> 'G' (Ítem agrupador)
                        if (chkBox.getAttribute('indice') != 'G') {
                            map.getLayersBy('layerIndiceReal', chkBox.getAttribute('indice'))[0].setVisibility(false);
                            visibilidade = false;
                        }
                    }
                }

                //Se tiver subcamadas, varre todas deste agrupador setando a visibilidade
                jQuery.each(this.subcamadas, function (json5) {

                    //Só lê registros ativos
                    if (this.ativo == 'true') {
                        divChkBoxSub = document.getElementById("div_" + this.layerID);
                        chkBoxSub = document.getElementById(this.layerID);

                        //controla visibilidade da div que contém o checkBox, e com o índice salvo no atributo dele controla a visibilidade da camada correspondente

                        //como verificar se deve ser mostrado no zoom atual
                        var arrayZoomExib = this.aparencia.zoomExib.split("#");
                        if ($.inArray(zoom.toString(), arrayZoomExib) != -1) {
                            //if (this.aparencia.zoomMin <= zoom && zoom <= this.aparencia.zoomMax) {
                            ////divChkBoxSub.style.display = "block";
                            HabDesItemLS(divChkBoxSub, 'on');

                            //se o pai estiver desabilitado ou deschecado, desabilita também os filhos
                            /*28/08/14 if (chkBox.disabled == true || chkBox.checked == false) {
                            chkBoxSub.disabled = true;
                            }*/

                            //se o checkBox tem índice <> 'G' (Ítem agrupador)
                            //se o checkBox está checado e se o checkBox do grupo também está checado
                            //se o checkBox tem índice <> 'S' (Ítem agrupador)
                            if (chkBoxSub.getAttribute('indice') != 'S') {
                                if (chkBoxSub.checked == true /*&& chkBox.checked == true*/) {
                                    map.getLayersBy('layerIndiceReal', chkBoxSub.getAttribute('indice'))[0].setVisibility(true);
                                    visibilidade = true;
                                    //habilitar chk
                                    //chkBoxSub.disabled = false;
                                } else {
                                    map.getLayersBy('layerIndiceReal', chkBoxSub.getAttribute('indice'))[0].setVisibility(false);
                                    visibilidade = false;
                                    //desabilitar chk
                                    //chkBoxSub.disabled = true;
                                }

                            }



                        } else {
                            ////divChkBoxSub.style.display = "none";
                            HabDesItemLS(divChkBoxSub, 'off');

                            if (chkBoxSub.getAttribute('indice') != 'S') {
                                map.getLayersBy('layerIndiceReal', chkBoxSub.getAttribute('indice'))[0].setVisibility(false);
                                visibilidade = false;
                            }



                        }


                        //Se esta subcamada tiver rotulo ativo seta a visibilidade
                        if (this.rotulo.ativo == 'true') {

                            //var indicesRotulos;
                            //var arrayIndicesRotulos;
                            var indiceRotulo = chkBoxSub.getAttribute('indiceRotulo');
                            var arrayZoomExibRot = chkBoxSub.getAttribute('zoomRotulo');
                            var imagemRotulo = document.getElementById("img_" + this.layerID);

                            arrayZoomExibRot = arrayZoomExibRot.split("#");
                            //pode ser exibido nesse zoom?
                            if ($.inArray(zoom.toString(), arrayZoomExibRot) != -1) {
                                imagemRotulo.setAttribute('permitido', 'true');
                            } else {
                                imagemRotulo.setAttribute('permitido', 'false');
                            }


                            if (visibilidade == true) {
                                if (imagemRotulo.getAttribute('permitido') == 'true') {
                                    //o rotulo está ativado?
                                    if (imagemRotulo.getAttribute('status') == 'on') {
                                        //exibe o rotulo
                                        if (indiceRotulo != '') {
                                            map.getLayersBy('layerIndiceReal', parseInt(indiceRotulo))[0].setVisibility(true);

                                            //05/05/2014 - Agora desabilita a camada caso o rótulo seja ativado
                                            map.getLayersBy('layerIndiceReal', chkBoxSub.getAttribute('indice'))[0].setVisibility(false);

                                            imagemRotulo.src = "../js/img/switcher-on.png";
                                        }
                                    } else {
                                        imagemRotulo.src = "../js/img/switcher-off.png";
                                    }
                                } else {
                                    map.getLayersBy('layerIndiceReal', parseInt(indiceRotulo))[0].setVisibility(false);


                                    //muda imagem para sem rótulo
                                    imagemRotulo.src = "../js/img/switcher-none.png";
                                }
                            } else {
                                map.getLayersBy('layerIndiceReal', parseInt(indiceRotulo))[0].setVisibility(false);

                                if (imagemRotulo.getAttribute('permitido') == 'true') {
                                    if (imagemRotulo.getAttribute('status') == 'on') {
                                        imagemRotulo.src = "../js/img/switcher-on.png";
                                    } else {
                                        imagemRotulo.src = "../js/img/switcher-off.png";
                                    }
                                } else {
                                    imagemRotulo.src = "../js/img/switcher-none.png";
                                }
                            } //fim if visibilidade
                        }
                    }
                });  //fim loop subcamadas


                //Se tiver rotulos, seta a visibilidade
                if (this.rotulo.ativo == 'true') {
                    //Se esta subcamada tiver rotulos, varre todos dessa camada setando a visibilidade
                    //var indicesRotulos;
                    //var arrayIndicesRotulos;
                    var indiceRotulo = chkBox.getAttribute('indiceRotulo');
                    var arrayZoomExibRot = chkBox.getAttribute('zoomRotulo');
                    var imagemRotulo = document.getElementById("img_" + this.layerID);
                    arrayZoomExibRot = arrayZoomExibRot.split("#");

                    //pode ser exibido nesse zoom?
                    if ($.inArray(zoom.toString(), arrayZoomExibRot) != -1) {
                        imagemRotulo.setAttribute('permitido', 'true');
                    } else {
                        imagemRotulo.setAttribute('permitido', 'false');
                    }


                    if (visibilidade == true) {
                        if (imagemRotulo.getAttribute('permitido') == 'true') {
                            //o rotulo está ativado?
                            if (imagemRotulo.getAttribute('status') == 'on') {
                                //exibe o rotulo
                                if (indiceRotulo != '') {
                                    map.getLayersBy('layerIndiceReal', parseInt(indiceRotulo))[0].setVisibility(true);

                                    //05/05/2014 - Agora desabilita a camada caso o rótulo seja ativado
                                    map.getLayersBy('layerIndiceReal', chkBox.getAttribute('indice'))[0].setVisibility(false);
                                    imagemRotulo.src = "../js/img/switcher-on.png";
                                }
                            } else {
                                imagemRotulo.src = "../js/img/switcher-off.png";
                            }
                        } else {
                            map.getLayersBy('layerIndiceReal', parseInt(indiceRotulo))[0].setVisibility(false);

                            //muda imagem para sem rótulo
                            imagemRotulo.src = "../js/img/switcher-none.png";
                        }
                    } else {
                        map.getLayersBy('layerIndiceReal', parseInt(indiceRotulo))[0].setVisibility(false);

                        if (imagemRotulo.getAttribute('permitido') == 'true') {
                            if (imagemRotulo.getAttribute('status') == 'on') {
                                imagemRotulo.src = "../js/img/switcher-on.png";
                            } else {
                                imagemRotulo.src = "../js/img/switcher-off.png";
                            }
                        } else {
                            imagemRotulo.src = "../js/img/switcher-none.png";
                        }
                    } //fim if visibilidade
                }
            });
    });
}


//***************************************************************************************************************************************************
//***************************************************************************************************************************************************
//Nome: controlaNiveisInformacao()
//Objetivo: 
//Disparador(es):
//***************************************************************************************************************************************************
//***************************************************************************************************************************************************
/*function controlaNiveisInformacao(zoom) {
jQuery.getJSON('../js/Layers.js', function (json5) {

var contadorCamadas = 0;
var comboDinamico = '';
var comboDinamicoPai = '';
var comboDinamicoFilho = '';
var layerPai6, layerPai7, layerPai8;
layerPai6 = layerPai7 = layerPai8 = '';
var exibePai = false;
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
comboDinamicoPai += '<option value="' + this.layerID + '">' + this.layerLabel + '</option>';
layerPai6 = this.layerID;
//console.log('json6-PAI: ' + layerPai6);
                        
}

//como verificar se deve ser mostrado no zoom atual
var arrayZoomExib = this.aparencia.zoomExib.split("#");
if ($.inArray(zoom.toString(), arrayZoomExib) != -1 && document.getElementById(this.layerID).checked) {
if (this.info.informacao == 'true') {

//console.log('json6: ' + this.info.infoNome);
comboDinamicoFilho += "<option tipo='" + layerPai6 + "' value='" + this.info.infoLayer + "|" + this.info.infoGeom + "|" + this.info.infoCampos + "|" + this.info.infoLabels + "|" + this.info.tipo + "'>" + this.info.infoNome + "</option>";
//cria os options no combo de selecao de camadas 
//comboDinamico = comboDinamico + "<option value='" + this.info.infoLayer + "|" + this.info.infoGeom + "'>" + this.layerLabel + "</option>";
comboDinamico = comboDinamico + "<option value='" + this.info.infoLayer + "|" + this.info.infoGeom + "|" + this.info.infoCampos + "|" + this.info.infoLabels + "|" + this.info.tipo + "'>" + this.info.infoNome + "</option>";
contadorCamadas = contadorCamadas + 1;
}
}
//fim como verificar se deve ser mostrado no zoom atual

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
comboDinamicoPai += '<option value="' + this.layerID + '">' + this.layerLabel + '</option>';
layerPai7 = this.layerID;
//console.log('json7-PAI: ' + layerPai7);
}


//como verificar se deve ser mostrado no zoom atual
var arrayZoomExib = this.aparencia.zoomExib.split("#");
if ($.inArray(zoom.toString(), arrayZoomExib) != -1 && document.getElementById(this.layerID).checked) {
if (this.info.informacao == 'true') {

//console.log('json7: ' + this.info.infoNome);
comboDinamicoFilho += "<option tipo='" + layerPai6 + "' value='" + this.info.infoLayer + "|" + this.info.infoGeom + "|" + this.info.infoCampos + "|" + this.info.infoLabels + "|" + this.info.tipo + "'>" + this.info.infoNome + "</option>";
//cria os options no combo de selecao de camadas
comboDinamico = comboDinamico + "<option value='" + this.info.infoLayer + "|" + this.info.infoGeom + "|" + this.info.infoCampos + "|" + this.info.infoLabels + "|" + this.info.tipo + "'>" + this.info.infoNome + "</option>";
contadorCamadas = contadorCamadas + 1;
}
}
//fim como verificar se deve ser mostrado no zoom atual


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
comboDinamicoPai += '<option value="' + this.layerID + '">' + this.layerLabel + '</option>';
layerPai8 = this.layerID;
//console.log('json8-PAI: ' + layerPai8);
}


//como verificar se deve ser mostrado no zoom atual
var arrayZoomExib = this.aparencia.zoomExib.split("#");
if ($.inArray(zoom.toString(), arrayZoomExib) != -1 && document.getElementById(this.layerID).checked) {
if (this.info.informacao == 'true') {
//console.log('json8: ' + this.info.infoNome);
comboDinamicoFilho += "<option tipo='" + layerPai7 + "' value='" + this.info.infoLayer + "|" + this.info.infoGeom + "|" + this.info.infoCampos + "|" + this.info.infoLabels + "|" + this.info.tipo + "'>" + this.info.infoNome + "</option>";
//cria os options no combo de selecao de camadas
comboDinamico = comboDinamico + "<option value='" + this.info.infoLayer + "|" + this.info.infoGeom + "|" + this.info.infoCampos + "|" + this.info.infoLabels + "|" + this.info.tipo + "'>" + this.info.infoNome + "</option>";
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
comboDinamicoPai = '<option value="">Selecione um grupo</option>' + comboDinamicoPai;
comboDinamicoFilho = comboDinamicoFilho;
//joga o combo gerado dinamicamente ao combo da tela
//old ie8 document.getElementById("cboCamada").innerHTML = comboDinamico;
jQuery('#cboCamada').html(comboDinamico);
jQuery('#cboCamadaPai').html(comboDinamicoPai);
jQuery('#cboCamadaFilhoH').html(comboDinamicoFilho);

$("#cboCamada").html($('#cboCamada option').sort(function (x, y) {
return $(x).text().replace('Á', 'A') < $(y).text().replace('Á', 'A') ? -1 : 1;
}));

//adiciona opção default fora da ordenação
var atual = jQuery('#cboCamada').html();
jQuery('#cboCamada').html("<option value=''>Selecione a camada</option>" + atual);


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



}
*/

//***************************************************************************************************************************************************
//***************************************************************************************************************************************************
//Nome: controlaNiveisPDF()
//Objetivo: 
//Disparador(es):
//***************************************************************************************************************************************************
//***************************************************************************************************************************************************
function controlaNiveisPDF(zoom) {
    jQuery.getJSON('../js/Layers.js', function (json5) {

        var contadorCamadas = 0;
        var comboDinamico;
        comboDinamico = comboDinamico + "<option value=''>Selecione a camada</option>";

        //varre o arquivo JSON
        jQuery.each(json5.layersMapa, function (json6) {
            //Se tiver subcamadas, varre todas deste agrupador verificando se deve ou nao exibir informacoes
            jQuery.each(this.subcamadas, function (json7) {
                //if (this.layerID.PDF.valor == 'S' || this.layerID.PDF.valor == 'Q') {
                //*****************
                //Se tiver subcamadas nivel 2, varre todas deste agrupador verificando se deve ou nao exibir informacoes
                jQuery.each(this.subcamadas, function (json8) {
                    //if (this.layerID.PDF.valor == 'S' || this.layerID.PDF.valor == 'Q') {
                });  //fim loop subcamadas nivel 2



                //*****************
            });  //fim loop subcamadas
        });

        if (contadorCamadas != 0) {
            //joga o combo gerado dinamicamente ao combo da tela
            //document.getElementById("cboCamadaPDF").innerHTML = comboDinamico;
            jQuery('#cboCamadaPDF').html(comboDinamico);

            //Habilita a exibição do botão de PDF
            /*
            if (globalctlBtnPDF.panel_div.className == "ctlBtnPDFItemActive olButton") {
            globalctlBtnPDF.panel_div.className = "ctlBtnPDFItemActive olButton";
            } else {
            globalctlBtnPDF.panel_div.className = "ctlBtnPDFItemInactive olButton";
            }
            */
            habilitaPDF = true;
        } else {
            //Desabilita a exibição do botão de PDF
            habilitaPDF = false;
            //document.getElementById('visuPDF').style.display = 'none';
            jQuery('#visuPDF').css('display', 'none');
            //    globalctlBtnPDF.panel_div.className = "ctlBtnPDFItemInactiveTransparent olButton";
        }
    });



}



//***************************************************************************************************************************************************
//***************************************************************************************************************************************************
//Nome: controlaNiveisSelecao()
//Objetivo: 
//Disparador(es):
//***************************************************************************************************************************************************
//***************************************************************************************************************************************************
//todo 1703

//OLD

/*
function controlaNiveisSelecao(zoom) {
jQuery.getJSON('../js/Layers.js', function (jsonS) {

var contadorCamadas = 0;
var comboDinamico;
//comboDinamico = comboDinamico + "<option value=''>Selecione a camada</option>";

//varre o arquivo JSON
jQuery.each(jsonS.layersMapa, function (jsonS2) {
if (this.ativo == 'true') {
if (this.selecao.possuiSelecao == 'true') {
//como verificar se deve ser mostrado no zoom atual
var arrayZoomExib = this.aparencia.zoomExib.split("#");
if ($.inArray(zoom.toString(), arrayZoomExib) != -1) {
//cria os options no combo de selecao de camadas
comboDinamico = comboDinamico + "<option value='" + this.selecao.camada + "'>" + this.selecao.selecaoLabel + "</option>";
contadorCamadas = contadorCamadas + 1;

}
//fim como verificar se deve ser mostrado no zoom atual
}
}
//Se tiver subcamadas, varre todas deste agrupador verificando se deve ou nao exibir informacoes
jQuery.each(this.subcamadas, function (jsonS3) {
if (this.ativo == 'true') {
if (this.selecao.possuiSelecao == 'true') {
//como verificar se deve ser mostrado no zoom atual
var arrayZoomExib = this.aparencia.zoomExib.split("#");
if ($.inArray(zoom.toString(), arrayZoomExib) != -1) {
//cria os options no combo de selecao de camadas
comboDinamico = comboDinamico + "<option value='" + this.selecao.camada + "'>" + this.selecao.selecaoLabel + "</option>";
contadorCamadas = contadorCamadas + 1;
}
}
}
//********************
//Se tiver subcamadas nivel 2, varre todas deste agrupador verificando se deve ou nao exibir informacoes
jQuery.each(this.subcamadas, function (jsonS3) {
if (this.ativo == 'true') {
if (this.selecao.possuiSelecao == 'true') {
//como verificar se deve ser mostrado no zoom atual
var arrayZoomExib = this.aparencia.zoomExib.split("#");
if ($.inArray(zoom.toString(), arrayZoomExib) != -1) {
//cria os options no combo de selecao de camadas
comboDinamico = comboDinamico + "<option value='" + this.selecao.camada + "'>" + this.selecao.selecaoLabel + "</option>";
contadorCamadas = contadorCamadas + 1;
}
}
}

});  //fim loop subcamadas nivel 2
//********************
});  //fim loop subcamadas
});

if (contadorCamadas != 0) {


//joga o combo gerado dinamicamente ao combo da tela
jQuery('#cboCamadaSelecao').html(comboDinamico);


//ordena a o combo
var lista = jQuery("#cboCamadaSelecao option");
lista.sort(function (a, b) {
return (a.text < b.text) ? -1 : (a.text > b.text) ? 1 : 0;
//or you can have a.text, b.text, etc
});
jQuery(lista).remove();
jQuery("#cboCamadaSelecao").append(jQuery(lista));


//adiciona opção default fora da ordenação
var atual = jQuery('#cboCamadaSelecao').html();
jQuery('#cboCamadaSelecao').html("<option value=''>Selecione a camada</option>" + atual);


//Habilita a exibição do botão de seleção
if (globalctlBtnSelecao.panel_div.className == "ctlBtnSelecaoItemActive olButton") {
globalctlBtnSelecao.panel_div.className = "ctlBtnSelecaoItemActive olButton";
} else {
globalctlBtnSelecao.panel_div.className = "ctlBtnSelecaoItemInactive olButton";
}

habilitaSelecao = true;
} else {
//Desabilita a exibição do botão de Selecao
habilitaSelecao = false;
jQuery('#selecao').css('display', 'none');
globalctlBtnSelecao.panel_div.className = "ctlBtnSelecaoItemInactiveTransparent olButton";
}
});

}*/
function controlaNiveisSelecao(zoom) {
    jQuery.getJSON('../js/Layers.js', function (jsonS) {

        var contadorCamadas = 0;
        var comboDinamico;
        var comboDinamicoPai = '';
        var comboDinamicoFilho = '';
        var layerPai6, layerPai7, layerPai8;
        layerPai6 = layerPai7 = layerPai8 = '';
        var exibePai = false;

        //        layersSelect = [];
        //comboDinamico = comboDinamico + "<option value=''>Selecione a camada</option>";

        //varre o arquivo JSON
        jQuery.each(jsonS.layersMapa, function (jsonS2) {
            if (this.ativo == 'true') {
                if (this.subcamadas != undefined && this.subcamadas.length > 0) {
                    for (var i = 0; i < this.subcamadas.length; i++) {
                        if (eval(this.subcamadas[i].selecao.possuiSelecao) && document.getElementById(this.subcamadas[i].layerID).checked) {
                            exibePai = true;
                            break;
                        } else {
                            exibePai = false;
                        }
                        //exibePai = eval(this.subcamadas[i].selecao.possuiSelecao);
                        //if (exibePai) break;
                    }
                }
                if (eval(this.agrupador) && exibePai) {
                    comboDinamicoPai += '<option value="' + this.layerID + '">' + this.layerLabel + '</option>';
                    layerPai6 = this.layerID;
                    //console.log('json6-PAI: ' + layerPai6);

                }


                if (this.selecao.possuiSelecao == 'true') {
                    //como verificar se deve ser mostrado no zoom atual
                    var arrayZoomExib = this.aparencia.zoomExib.split("#");
                    if ($.inArray(zoom.toString(), arrayZoomExib) != -1 && document.getElementById(this.layerID).checked) {
                        //cria os options no combo de selecao de camadas
                        comboDinamicoFilho += "<option tipo='" + layerPai6 + "' value='" + this.selecao.camada + "'>" + this.selecao.selecaoLabel + "</option>";
                        comboDinamico = comboDinamico + "<option value='" + this.selecao.camada + "'>" + this.selecao.selecaoLabel + "</option>";
                        contadorCamadas = contadorCamadas + 1;

                        //                        criaArrayLayersSelect(this);
                    }
                    //fim como verificar se deve ser mostrado no zoom atual
                }
            }
            //Se tiver subcamadas, varre todas deste agrupador verificando se deve ou nao exibir seleção
            jQuery.each(this.subcamadas, function (jsonS3) {
                if (this.ativo == 'true') {

                    if (this.subcamadas != undefined && this.subcamadas.length > 0) {
                        for (var i = 0; i < this.subcamadas.length; i++) {
                            if (eval(this.subcamadas[i].selecao.possuiSelecao) && document.getElementById(this.subcamadas[i].layerID).checked) {
                                exibePai = true;
                                break;
                            } else {
                                exibePai = false;
                            }
                            //exibePai = eval(this.subcamadas[i].selecao.possuiSelecao);
                            //if (exibePai) break;
                        }
                    }
                    if (eval(this.agrupador) && exibePai) {
                        comboDinamicoPai += '<option value="' + this.layerID + '">' + this.layerLabel + '</option>';
                        layerPai7 = this.layerID;
                        //console.log('json7-PAI: ' + layerPai7);
                    }


                    if (this.selecao.possuiSelecao == 'true') {
                        //como verificar se deve ser mostrado no zoom atual
                        var arrayZoomExib = this.aparencia.zoomExib.split("#");
                        if ($.inArray(zoom.toString(), arrayZoomExib) != -1 && document.getElementById(this.layerID).checked) {
                            //cria os options no combo de selecao de camadas
                            comboDinamicoFilho += "<option tipo='" + layerPai6 + "' value='" + this.selecao.camada + "'>" + this.selecao.selecaoLabel + "</option>";
                            comboDinamico = comboDinamico + "<option value='" + this.selecao.camada + "'>" + this.selecao.selecaoLabel + "</option>";
                            contadorCamadas = contadorCamadas + 1;

                            //                            criaArrayLayersSelect(this);
                        }
                    }
                }
                //********************
                //Se tiver subcamadas nivel 2, varre todas deste agrupador verificando se deve ou nao exibir seleção
                jQuery.each(this.subcamadas, function (jsonS3) {
                    if (this.ativo == 'true') {

                        if (this.subcamadas != undefined && this.subcamadas.length > 0) {
                            for (var i = 0; i < this.subcamadas.length; i++) {
                                if (eval(this.subcamadas[i].selecao.possuiSelecao) && document.getElementById(this.subcamadas[i].layerID).checked) {
                                    exibePai = true;
                                    break;
                                } else {
                                    exibePai = false;
                                }
                                //exibePai = eval(this.subcamadas[i].selecao.possuiSelecao);
                                //if (exibePai) break;
                            }
                        }
                        if (eval(this.agrupador) && exibePai) {
                            comboDinamicoPai += '<option value="' + this.layerID + '">' + this.layerLabel + '</option>';
                            layerPai8 = this.layerID;
                            //console.log('json8-PAI: ' + layerPai8);
                        }


                        if (this.selecao.possuiSelecao == 'true') {
                            //como verificar se deve ser mostrado no zoom atual
                            var arrayZoomExib = this.aparencia.zoomExib.split("#");
                            if ($.inArray(zoom.toString(), arrayZoomExib) != -1 && document.getElementById(this.layerID).checked) {
                                //cria os options no combo de selecao de camadas
                                comboDinamicoFilho += "<option tipo='" + layerPai7 + "' value='" + this.selecao.camada + "'>" + this.selecao.selecaoLabel + "</option>";
                                //cria os options no combo de selecao de camadas
                                comboDinamico = comboDinamico + "<option value='" + this.selecao.camada + "'>" + this.selecao.selecaoLabel + "</option>";
                                contadorCamadas = contadorCamadas + 1;

                                //                                criaArrayLayersSelect(this);
                            }
                        }
                    }

                });  //fim loop subcamadas nivel 2
                //********************
            });  //fim loop subcamadas
        });

        if (contadorCamadas != 0) {

            comboDinamicoPai = '<option value="">Selecione um grupo</option>' + comboDinamicoPai;
            comboDinamicoFilho = comboDinamicoFilho;


            //joga o combo gerado dinamicamente ao combo da tela
            jQuery('#cboCamadaSelecao').html(comboDinamico);
            jQuery('#cboCamadaSelecaoPai').html(comboDinamicoPai);
            jQuery('#cboCamadaSelecaoFilhoH').html(comboDinamicoFilho);


            $("#cboCamadaSelecao").html($('#cboCamadaSelecao option').sort(function (x, y) {
                return $(x).text().replace('Á', 'A') < $(y).text().replace('Á', 'A') ? -1 : 1;
            }));


            //adiciona opção default fora da ordenação
            var atual = jQuery('#cboCamadaSelecao').html();
            jQuery('#cboCamadaSelecao').html("<option value=''>Selecione a camada</option>" + atual);


            //Habilita a exibição do botão de seleção
            /*if (globalctlBtnSelecao.panel_div.className == "ctlBtnSelecaoItemActive olButton") {
            globalctlBtnSelecao.panel_div.className = "ctlBtnSelecaoItemActive olButton";
            } else {
            globalctlBtnSelecao.panel_div.className = "ctlBtnSelecaoItemInactive olButton";
            }

            habilitaSelecao = true;*/

            //habilita seleção da camada mais alta
            //            var iMaior = layersSelect[0].ordemExib;
            //            for (i = 0; i < layersSelect.length; i++) {
            //                if (iMaior < layersSelect[i].ordemExib) {
            //                    iMaior = layersSelect[i].ordemExib; 
            //                }
            //            }


        } else {
            //Desabilita a exibição do botão de Selecao
            /*habilitaSelecao = false;
            jQuery('#selecao').css('display', 'none');
            globalctlBtnSelecao.panel_div.className = "ctlBtnSelecaoItemInactiveTransparent olButton";*/
        }
    });

}


function criaArrayLayersSelect(item) {

    var layerID = item.layerID;
    var layerLabel = item.layerLabel;
    var ordemExib = item.ordemExib;
    //var info_tipo = item.info.tipo;
    //var info_infoNome = item.info.infoNome;
    //var info_infoLayer = item.info.infoLayer;
    //var info_infoGeom = item.info.infoGeom;
    //var info_infoCampos = item.info.infoCampos;
    //var info_infoLabels = item.info.infoLabels;
    var selecao_selecaoLabel = item.selecao.selecaoLabel;
    var selecao_camada = item.selecao.camada;
    var aparencia_zoomExib = item.aparencia.zoomExib;


    var layersSelectTmp = { layerID: layerID,
        layerLabel: layerLabel,
        ordemExib: ordemExib,
        selecao_selecaoLabel: selecao_selecaoLabel,
        selecao_camada: selecao_camada,
        aparencia_zoomExib: aparencia_zoomExib
    };

    layersSelect.push(layersSelectTmp);
}

