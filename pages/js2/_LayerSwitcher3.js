
var layers = new Array();
var LayersBusca;

//***************************************************************************************************************************************************
//***************************************************************************************************************************************************
//Nome: carregaLayerSwicher()
//Objetivo: Lê o arquivo Json de configuração e carrega as camadas, criando também o Layer Switch para o controle destas.
//Disparador(es): init();
//***************************************************************************************************************************************************
//***************************************************************************************************************************************************

function carregaLayerSwicherB() {
    var htmlDinamicoBase = "";
    var htmlDinamico = "";
    var htmlSubDinamico = "";
    var htmlDinamicoGrupo = "";
    var htmlDinamicoSubGrupo = "";
    var htmlDinamicoItens = "";
    var htmlDinamicoSubItens = "";
    var htmlDinamicoTotal = "";
    //var layersBase = new Array();

    var indexArrayLayers = 0;
    var fatorBasesAdicionados = 0;
    var indexGrupo = 0;
    var indexSubGrupo = 1000;
    var baselayer = 'TRUE';
    var zoomAtual = 0; //Valor default do zoom de início


    //*******************************************************************************************************************************************************
    //****************************************************************** CAMADAS MAPABASE *******************************************************************
    //*******************************************************************************************************************************************************

    jQuery.getJSON('../js/LayersBase.js', function (jsonB) {
        //varre o arquivo JSON
        jQuery.each((jsonB.layersMapa), function (jsonB2) {
            //Só lê registros ativos
            if (this.ativo == 'true') {
                //Monta o checkbox na DIV para cara registro
                montaHtml(this, "base");
                fatorBasesAdicionados = fatorBasesAdicionados + 1;  //adiciona quantidade de layers adicionados no MapaBase para contagem a partir daí
            } //end ativo
        }); // end each mapabase

        //*******************************************************************************************************************************************************
        //****************************************************************** DEMAIS CAMADAS *********************************************************************
        //*******************************************************************************************************************************************************
        baselayer = 'FALSE';

        jQuery.getJSON('../js/Layers.js', function (json) {
            //varre o arquivo JSON
            jQuery.each(
                        (json.layersMapa), function (json2) {
                            //Só lê registros ativos
                            if (this.ativo == 'true') {
                                //Cria o new layer (exceto se for apenas um agrupador)
                                if (this.agrupador == 'false') {

                                    //Monta o checkbox na DIV para cara registro
                                    montaHtml(this, "item");
                                    //10102014 htmlDinamicoTotal = htmlDinamico + htmlDinamicoTotal;
                                    htmlDinamicoTotal = htmlDinamicoTotal + htmlDinamico
                                    varHtmlDinamico = "";

                                } else {

                                    //Monta o checkbox na DIV para cara registro
                                    montaHtml(this, "grupo");

                                    //Varre todas as subcamadas deste agrupador criando os ítens e carregando os Layers
                                    jQuery.each(this.subcamadas, function (json3) {
                                        if (this.agrupador == 'true') {
                                            montaHtml(this, "subgrupo");

                                            //Varre todas as subcamadas deste agrupador criando os ítens e carregando os Layers
                                            jQuery.each(this.subcamadas, function (json4) {
                                                montaHtml(this, "subitem2");  /////////////////////////////////////////////////////////////////////
                                            });  //fim loop subcamadas


                                            //monta uma div para poder esconder e mostrar os ítens do grupo
                                            //htmlDinamicoSubGrupo = '<div id = "divSubGp_' + this.layerID + '"  style="display: block;">' + htmlDinamicoSubGrupo + '</div>';
                                            htmlDinamicoSubGrupo = '<div id = "divGp_' + this.layerID + '"  style="display: none;">' + htmlDinamicoSubGrupo + '</div>';

                                            //concatena os htmls
                                            htmlDinamicoGrupo = htmlDinamicoGrupo + htmlSubDinamico + htmlDinamicoSubGrupo;
                                            htmlSubDinamico = "";
                                            htmlDinamicoSubGrupo = "";

                                        } else {
                                            montaHtml(this, "subitem"); ///////////////////////////////////////////////////////////////////////////////
                                        }

                                    });  //fim loop subcamadas


                                    //monta uma div para poder esconder e mostrar os ítens do grupo
                                    htmlDinamicoGrupo = '<div id = "divGp_' + this.layerID + '"  style="display: none;">' + htmlDinamicoGrupo + '</div>';

                                    //concatena os htmls
                                    //10102014 htmlDinamicoTotal = htmlDinamico + htmlDinamicoGrupo + htmlDinamicoTotal;
                                    htmlDinamicoTotal = htmlDinamicoTotal + htmlDinamico + htmlDinamicoGrupo;
                                    htmlDinamico = "";
                                    htmlDinamicoGrupo = "";
                                } //end if this.agrupador == 'false'
                            } //fim registros ativos
                            baselayer = 'FALSE';
                        }
                );  // fim each demais camadas

            var innerTemp;

            //document.getElementById("Layers").innerHTML = '<div id="LayersWhite" style="display: none;">' + htmlDinamicoTotal + '</div>';

            //innerTemp = innerTemp + '<div id="LayersWhiteMapabase" style="display: none;">Mapabase aqui</div>';

            innerTemp = '<div id="LayersWhiteCamadas" style="display: none;">' + '<div style="height: 15px;"></div>' + '<b>' + '<img src="../js/img/plusbottom.gif" border="0" id="btnExibeInibeCamadasMapaBase" title="Clique para expandir ou fechar o grupo de mapas base e imagens." onclick="ExibeInibeCamadasMapabase();">' + '&nbsp;Mapa Base</b><div id="LSMapaBase" style="display:none;">' + htmlDinamicoBase + '</div><br><br><b>' + '<img src="../js/img/minusbottomdesab.gif" border="0" id="btnExibeInibeCamadas">' + '&nbsp;Camadas</b>' + htmlDinamicoTotal + '</div>';
            innerTemp = innerTemp + '<div id="LayersWhitePlus"><table><tr><td><img src="../js/img/plusbottom.gif" border="0" id="btnExibeInibeOcultaveis" onclick="ExibeInibeCamposOcultaveis();"><label id="lblExibeInibeOcultaveis" class="lblLayerSwitcher">&nbsp;&nbsp;Exibir camadas</label></td></tr></table></div>';
            document.getElementById("Layers").innerHTML = innerTemp;

            //define o array com os headers das campanhas mensais
            var arrayHeaderCampanhas = [
                {
                    'mes': 'Janeiro',
                    'imagem': 'HeaderLeft_GeoSampa_Mapa_mes_01',
                    'coordsMapImage': '361,0,362,15,368,23,364,43,384,43,397,39,398,22,387,12,383,1',
                    'tooltip': 'Conscientização da Saúde Mental'
                },
                {
                    'mes': 'Fevereiro',
                    'imagem': 'HeaderLeft_GeoSampa_Mapa_mes_02',
                    'coordsMapImage': '366,-1,361,9,369,26,365,44,385,43,386,37,397,43,403,23,388,17,380,1',
                    'tooltip': 'Conscientização do Alzheimer'
                },
                {
                    'mes': 'Março',
                    'imagem': 'HeaderLeft_GeoSampa_Mapa_mes_03',
                    'coordsMapImage': '376,0,368,8,368,21,374,28,376,43,394,43,395,28,400,19,397,5,387,1',
                    'tooltip': 'Mês da Mulher'
                },
                {
                    'mes': 'Abril',
                    'imagem': 'HeaderLeft_GeoSampa_Mapa_mes_04',
                    'coordsMapImage': '373,-1,371,14,377,20,374,42,389,43,389,33,399,39,403,22,395,14,387,0',
                    'tooltip': 'Conscientização do Autismo'
                },
                {
                    'mes': 'Maio',
                    'imagem': 'HeaderLeft_GeoSampa_Mapa_mes_05',
                    'coordsMapImage': '373,-1,368,10,370,19,377,26,379,42,391,42,392,36,401,40,404,22,395,18,389,3,381,0',
                    'tooltip': 'Campanha de Redução de Acidentes de Trânsito'
                },
                {
                    'mes': 'Junho',
                    'imagem': 'HeaderLeft_GeoSampa_Mapa_mes_06',
                    'coordsMapImage': '363,7,364,35,403,36,404,8',
                    'tooltip': 'Orgulho LGBTQIA+'
                },
                {
                    'mes': 'Julho',
                    'imagem': 'HeaderLeft_GeoSampa_Mapa_mes_07',
                    'coordsMapImage': '373,-1,368,10,370,19,377,26,379,42,391,42,392,36,401,40,404,22,395,18,389,3,381,0',
                    'tooltip': 'Conscientização de Hepatites Virais'
                },
                {
                    'mes': 'Agosto',
                    'imagem': 'HeaderLeft_GeoSampa_Mapa_mes_08',
                    'coordsMapImage': '371,1,357,34,361,43,401,44,401,32,390,0',
                    'tooltip': 'Incentivo à Amamentação'
                },
                {
                    'mes': 'Setembro',
                    'imagem': 'HeaderLeft_GeoSampa_Mapa_mes_09',
                    'coordsMapImage': '374,1,374,21,363,34,372,43,381,43,395,39,406,25,401,15,396,2',
                    'tooltip': 'Cuidados com a Saúde do Coração'
                },
                {
                    'mes': 'Outubro',
                    'imagem': 'HeaderLeft_GeoSampa_Mapa_mes_10',
                    'coordsMapImage': '383,1,376,13,378,23,369,43,386,43,406,43,396,25,398,15,391,3',
                    'tooltip': 'Conscientização do Câncer de Mama'
                },
                {
                    'mes': 'Novembro',
                    'imagem': 'HeaderLeft_GeoSampa_Mapa_mes_11',
                    'coordsMapImage': '372,0,360,10,358,26,370,44,390,44,402,31,401,12,389,1',
                    'tooltip': 'Consciência Negra'
                },
                {
                    'mes': 'Dezembro',
                    'imagem': 'HeaderLeft_GeoSampa_Mapa_mes_12',
                    'coordsMapImage': '370,1,368,11,376,23,370,37,377,43,385,43,387,35,400,43,404,29,392,20,387,1',
                    'tooltip': 'Prevenção HIV/AIDS e DSTs'
                },
            ];


            var data = new Date();

            //inicio - força data a partir do mês informado via query string, com o objetivo de validar headers das campanhas mensais
            //comentar após homologação
            //var qstrMesCampanha = getParameterByName('mes');
            //if (qstrMesCampanha != "") {               
                //data.setMonth(qstrMesCampanha - 1);               
            //}
            //fim

            //define o mês da campanha
            var mesCampanha = data.getMonth();

            //carrega o map do cabeçalho
            innerTemp = '<area alt="" title="" href="http://www.prefeitura.sp.gov.br/" shape="rect" coords="8,5,123,40" style="outline: none;" target="_self" />';
            innerTemp += '<area alt="" title="" href="../Default.aspx" shape="rect" coords="144,4,264,41" style="outline: none;" target="_self" />';
            //innerTemp += '<area title="' + arrayHeaderCampanhas[mesCampanha].tooltip + '" shape="poly" coords="' + arrayHeaderCampanhas[mesCampanha].coordsMapImage + '" style="outline: none;"  />';
            document.getElementById("MapaCabecalhoL").innerHTML = innerTemp;

            //carrega o cabeçalho
            innerTemp = '<table width="100%"><tr class="banner">';
            //innerTemp += '<td><img src="../css/img/headersCampanhas/' + arrayHeaderCampanhas[mesCampanha].imagem + '.png"  border="0" alt="Sistema de Consulta do Mapa Digital da Cidade de São Paulo - Prefeitura de São Paulo" title="Sistema de Consulta do Mapa Digital da Cidade de São Paulo" usemap="#MapaCabecalhoL" /></td>';
            innerTemp += '<td><img src="../css/img/HeaderLeft_GeoSampa_Mapa_ORIGINAL.png"  border="0" alt="Sistema de Consulta do Mapa Digital da Cidade de São Paulo - Prefeitura de São Paulo" title="Sistema de Consulta do Mapa Digital da Cidade de São Paulo" usemap="#MapaCabecalhoL" /></td>';
            innerTemp += '<td align="right"><img src="../css/img/HeaderRight_GeoSampa_Mapa.png"  border="0" alt="Sistema de Consulta do Mapa Digital da Cidade de São Paulo - Prefeitura de São Paulo" title="Sistema de Consulta do Mapa Digital da Cidade de São Paulo" usemap="#MapaCabecalhoR" /></td>';
            innerTemp += '</tr>';
            document.getElementById("Cabecalho").innerHTML = innerTemp;

            layers.sort(function (a, b) {
                if (parseFloat(a.layerOrdem) > parseFloat(b.layerOrdem))
                    return 1;
                if (parseFloat(a.layerOrdem) < parseFloat(b.layerOrdem))
                    return -1;
                // a must be equal to b
                return 0;
            });


            ///////////////////////////AINDA EM TESTES////////////////////////////////

            //var y = new OpenLayers.Layer.WMS('distrito_municipal', 'map.geo?hc=' + $('#hc').val() + '&', { LAYERS: 'geoportal:distrito_municipal', format: 'image/png' }, { 'ABC': '123' });
            //layers.push(eval(y));

            ///////////////////////////AINDA EM TESTES////////////////////////////////
            MontaOpenLayers(layers);

            //início ferramenta busca de camadas
            //o código está diferente do GEOSAMPA INTRANET pois foi melhorado

            const listaCamadas = [];
            
            fetch('../js/Layers.js')
                .then(r => r.json())
                .then(data => {
                    LayersBusca = data;

                    
                    const getSubs = n => {
                        const s = n && n.subcamadas;
                        if (!s) return [];
                        return Array.isArray(s) ? s : Object.values(s);
                    };
                    const isFalse = v => v === 'false' || v === false;

                    const visita = (n) => {
                        if (isFalse(n.ocultavel)) {
                            listaCamadas.push({ label: n.layerLabel, value: n.layerID });
                        }
                        getSubs(n).forEach(visita);
                    };

                    (LayersBusca.layersMapa || []).forEach(visita);

                    //console.log('Total:', listaCamadas.length, listaCamadas);
                });

            var divBuscaCamada = document.createElement("div");
            divBuscaCamada.style.position = "sticky"; // Mantém fixo dentro da div LayersWhiteCamadas
            divBuscaCamada.style.top = "0"; // Fixa no topo ao rolar
            divBuscaCamada.style.zIndex = "9999"; // Garante que fique acima dos outros elementos
            divBuscaCamada.style.backgroundColor = "#fff"; // Fundo para evitar sobreposição visual
            divBuscaCamada.style.padding = "10px";
            divBuscaCamada.style.boxShadow = "0px 2px 5px rgba(0, 0, 0, 0.2)"; // Sombra sutil

            var txtBuscaCamada = document.createElement("input");

            // Estilização do campo de busca
            txtBuscaCamada.style.width = "292px";
            txtBuscaCamada.style.padding = "8px 12px";
            txtBuscaCamada.style.fontSize = "12px";
            txtBuscaCamada.style.borderRadius = "5px";
            txtBuscaCamada.style.border = "1px solid #000";
            txtBuscaCamada.style.boxSizing = "border-box";
            txtBuscaCamada.className = "awesomplete";
            txtBuscaCamada.setAttribute("data-list", "listaCamadas");
            txtBuscaCamada.setAttribute("id", "txtBuscaCamada");
            //txtBuscaCamada.setAttribute("title", "Buscar camadas");
            txtBuscaCamada.placeholder = "Pesquisar camada";

            divBuscaCamada.appendChild(txtBuscaCamada);
            document.getElementById("LayersWhiteCamadas").insertAdjacentElement('afterbegin', divBuscaCamada);

            // Inicializar o Awesomplete
            var awesomplete = new Awesomplete(txtBuscaCamada);

            // Estilização da lista de sugestões
            awesomplete.ul.style.position = "absolute";
            awesomplete.ul.style.zIndex = "10000";
            awesomplete.ul.style.width = "100%";
            awesomplete.ul.style.top = "100%";
            awesomplete.ul.style.left = "0";
            awesomplete.ul.style.backgroundColor = "#fff";
            awesomplete.ul.style.fontSize = "12px";
            awesomplete.ul.style.border = "1px solid #ccc";
            awesomplete.ul.style.borderRadius = "5px";
            awesomplete.ul.style.boxShadow = "0px 4px 6px rgba(0, 0, 0, 0.1)";
            awesomplete.ul.style.padding = "5px 0";
            awesomplete.ul.style.listStyle = "none";

            awesomplete.list = listaCamadas;
            document.getElementById('txtBuscaCamada').addEventListener('awesomplete-selectcomplete', function (event) {
                mostraCamadaLS(event);
                this.selected = event.target.value;
                event.target.value = '';
            });

            // fim ferramenta busca de camadas


        }); //end get Json demais camadas

    });          //end get Json mapabase






    /*
    FUNCÃO MONTA HTML
    "base" - cria MapaBase
    "grupo" - cria Grupo
    "subgrupo" - cria subgrupo
    "item" - cria item no nível 0
    "subitem" - cria item no nível 1
    "subitem2" - cria item no nível 2
    */


    function montaHtml(thisJson, tipo) {
        if (tipo == "base") {

            layers.push(eval(chamaLayerEspecifico(thisJson.layerID, thisJson.conexao.tipo, thisJson.conexao.src, thisJson.conexao.base, thisJson.conexao.namespace, baselayer, thisJson.legenda, thisJson.tematico, thisJson.tematicoLegenda, thisJson.layerLabel, layers.length, parseInt(thisJson.ordemExib), thisJson.conexao.style)));

            fatorBasesAdicionados = fatorBasesAdicionados + 1;  //adiciona quantidade de layers adicionados no MapaBase para contagem a partir daí
            indexArrayLayers = layers.length - 1;
            //indexArrayLayers = thisJson.ordemExib;

            //Monta o checkbox na DIV para cara registro
            //controla visibilidade dos checkbox de acordo com o zoom

            //cria um tooltip mostrando em que níveis de zoom será mostrado
            var tooltip = 'Zoom de vizualização: ' + (thisJson.aparencia.zoomExib).replace('#', ',');

            //var arrayZoomExib = thisJson.aparencia.zoomExib.split("#");
            //if ($.inArray(zoomAtual.toString(), arrayZoomExib) != -1) {
            if (thisJson.ocultavel == 'false') {
                htmlDinamicoBase = htmlDinamicoBase + "<div style='display:block;' id='div_" + thisJson.layerID + "'><table><tr><td class='tdLayers'>&nbsp;&nbsp;&nbsp;<input id='" + thisJson.layerID + "' name='chkLayers' type='checkbox' indice='" + indexArrayLayers + "' indicegrupo='' indicesubgrupo='' agrupador='false' tipoControle='MB' onchange='chkChange(this)' "
            } else {
                htmlDinamicoBase = htmlDinamicoBase + "<div style='display:none;' id='div_" + thisJson.layerID + "'><table><tr><td class='tdLayers'>&nbsp;&nbsp;&nbsp;<input id='" + thisJson.layerID + "' name='chkLayers' type='checkbox' indice='" + indexArrayLayers + "' indicegrupo='' indicesubgrupo='' agrupador='false' tipoControle='MB' onchange='chkChange(this)' "
            }


            //Se for readOnly desabilita o chkbox e cria atributo somenteleitura
            if (thisJson.aparencia.readOnly == 'true') {
                htmlDinamicoBase = htmlDinamicoBase + " disabled = 'true' somenteleitura='true' ";
            } else {
                htmlDinamicoBase = htmlDinamicoBase + " somenteleitura='false' ";
            }

            if (thisJson.aparencia.visible == 'true') {
                htmlDinamicoBase = htmlDinamicoBase + "checked ";
                //Cria array com camadas que devem ser exibidas de acordo com o arquivo de configuração

                var arrayZoomExib = thisJson.aparencia.zoomExib.split("#");
                if ($.inArray(zoomAtual.toString(), arrayZoomExib) != -1) {
                    layersVisiveis.push(indexArrayLayers);
                } else {
                    layersInvisiveis.push(indexArrayLayers);
                }

            } else {
                layersInvisiveis.push(indexArrayLayers);
            }


            if (thisJson.aparencia.visible == 'true') {
                layersCargaInicialMapa.push(indexArrayLayers);
            }


            //cria atributo de ocultável ou não
            htmlDinamicoBase = htmlDinamicoBase + "ocultavel= '" + thisJson.ocultavel + "' ";

            //cria propriedades de zoomMax e zoomMin no controle e finaliza criação
            htmlDinamicoBase = htmlDinamicoBase + " zoomExib = '" + thisJson.aparencia.zoomExib + "' ";
            htmlDinamicoBase = htmlDinamicoBase + " indiceRotulo = ''";
            htmlDinamicoBase = htmlDinamicoBase + " zoomRotulo = '#'";
            //htmlDinamicoBase = htmlDinamicoBase + ">" + "<img src='../js/img/legenda.png' class='divLegenda' alt='legenda' tematico='true' onclick='javascript: if (thisJson.getAttribute(\"tematico\") == \"true\"){chamaLegenda('" + thisJson.tematicoLegenda + "')}'><label class='lblLayerSwitcherItem'>" + thisJson.layerLabel + "</label></td></tr></table></div>";
            htmlDinamicoBase = htmlDinamicoBase + ">" + "<img src='" + thisJson.legenda + "' class='divLegenda' alt='legenda' tematico='" + thisJson.tematico + "' srcTematico='" + thisJson.tematicoLegenda + "' onclick='javascript: if (this.getAttribute(\"tematico\") == \"true\"){chamaLegenda(\"" + thisJson.tematicoLegenda + "\")}'>" + (thisJson.Metadado.habilitaMetadado === "true" ? "<img src='../css/img/icones/metadados_icone.png' class='divLegenda' title='Clique para visualizar os metadados' " + "onclick='chamarMetadados(\"" + thisJson.Metadado.idMetadado + "\");'>" : "") + "<label class='lblLayerSwitcherItem' title='" + thisJson.tooltip + "'>" + thisJson.layerLabel + "</label></td></tr></table></div>";
        } else if (tipo == "item") {

            layers.push(eval(chamaLayerEspecifico(thisJson.layerID, thisJson.conexao.tipo, thisJson.conexao.src, thisJson.conexao.base, thisJson.conexao.namespace, baselayer, thisJson.legenda, thisJson.tematico, thisJson.tematicoLegenda, thisJson.layerLabel, layers.length, parseInt(thisJson.ordemExib) + fatorBasesAdicionados, thisJson.conexao.style)));
            indexArrayLayers = layers.length - 1;
            //indexArrayLayers = parseInt(thisJson.ordemExib) + fatorBasesAdicionados;

            //cria um tooltip mostrando em que níveis de zoom será mostrado
            var tooltip = 'Zoom de vizualização: ' + (thisJson.aparencia.zoomExib).replace('#', ',');

            //Monta o checkbox na DIV para cara registro
            //controla visibilidade dos checkbox de acordo com o zoom

            //var arrayZoomExib = thisJson.aparencia.zoomExib.split("#");
            //if ($.inArray(zoomAtual.toString(), arrayZoomExib) != -1) {
            if (thisJson.ocultavel == 'false') {
                htmlDinamico = htmlDinamico + "<div style='display:block;' id='div_" + thisJson.layerID + "'><table><tr><td class='tdLayers'>&nbsp;&nbsp;&nbsp;<input id='" + thisJson.layerID + "' name='chkLayers' type='checkbox' indice='" + indexArrayLayers + "' indicegrupo='G' indicesubgrupo='S' agrupador='false' tipoControle='I' onchange='chkChange(this)' "
            } else {
                htmlDinamico = htmlDinamico + "<div style='display:none;' id='div_" + thisJson.layerID + "'><table><tr><td class='tdLayers'>&nbsp;&nbsp;&nbsp;<input id='" + thisJson.layerID + "' name='chkLayers' type='checkbox' indice='" + indexArrayLayers + "' indicegrupo='G' indicesubgrupo='S' agrupador='false' tipoControle='I' onchange='chkChange(this)' "
            }


            //Se for readOnly desabilita o chkbox e cria atributo somenteleitura
            if (thisJson.aparencia.readOnly == 'true') {
                htmlDinamico = htmlDinamico + " disabled = 'true' somenteleitura='true' ";
            } else {
                htmlDinamico = htmlDinamico + " somenteleitura='false' ";
            }

            if (thisJson.aparencia.visible == 'true') {
                htmlDinamico = htmlDinamico + "checked ";
                //Cria array com camadas que devem ser exibidas de acordo com o arquivo de configuração

                var arrayZoomExib = thisJson.aparencia.zoomExib.split("#");
                if ($.inArray(zoomAtual.toString(), arrayZoomExib) != -1) {
                    layersVisiveis.push(indexArrayLayers);
                } else {
                    layersInvisiveis.push(indexArrayLayers);
                }

            } else {
                layersInvisiveis.push(indexArrayLayers);
            }


            //cria atributo de ocultável ou não
            htmlDinamico = htmlDinamico + "ocultavel= '" + thisJson.ocultavel + "' ";

            //cria propriedades de zoomMax e zoomMin no controle
            htmlDinamico = htmlDinamico + " zoomExib = '" + thisJson.aparencia.zoomExib + "' ";

            //************************************************************************
            //Verifica se existe rótulo, cria o vetor e joga o indice dele na propriedade do checkbox do Layer associado
            var vetorIndex = '';
            var exibe = false;
            var rotuloAtivo = false; //16-02-2016
            if (thisJson.rotulo.ativo == 'true') {
                //layers.push(eval(chamaVectorEspecifico(thisJson.transparent, thisJson.request, thisJson.service, thisJson.typeName, thisJson.featureType, thisJson.geometryName, thisJson.vector, thisJson.conexao.style)));
                layers.push(eval(chamaLayerEspecifico(thisJson.rotulo.layerID, thisJson.rotulo.conexao.tipo, thisJson.rotulo.conexao.src, thisJson.rotulo.conexao.base, thisJson.rotulo.conexao.namespace, baselayer, thisJson.legenda, thisJson.tematico, thisJson.tematicoLegenda, thisJson.layerLabel, layers.length, parseInt(thisJson.ordemExib) + fatorBasesAdicionados + 0.5, thisJson.rotulo.conexao.style)));
                vetorIndex = layers.length - 1;
                //vetorIndex = parseInt(thisJson.ordemExib) + fatorBasesAdicionados + 0.5
                rotuloAtivo = true; //16-02-2016

                var arrayZoomExibRot = thisJson.rotulo.aparencia.zoomExib.split("#");
                if ($.inArray(zoomAtual.toString(), arrayZoomExibRot) != -1) {
                    layersVisiveis.push(indexArrayLayers);
                    exibe = true;
                } else {
                    layersInvisiveis.push(indexArrayLayers);
                }
            }

            if (vetorIndex != '') {
                htmlDinamico = htmlDinamico + " indiceRotulo='" + vetorIndex + "' ";
                htmlDinamico = htmlDinamico + " zoomRotulo='" + thisJson.rotulo.aparencia.zoomExib + "' ";
                //cria o botão do rótulo
                if (exibe == true) {
                    htmlDinamico = htmlDinamico + ">" + "<img src='../js/img/switcher-on.png' id='img_" + thisJson.layerID + "' class='divRotulo' status='on' permitido = 'true' onclick='chaveiaRotulos(" + thisJson.layerID + ");'><img src='" + thisJson.legenda + "' tematico='" + thisJson.tematico + "'srcTematico='" + thisJson.tematicoLegenda + "' onclick='javascript: if (this.getAttribute(\"tematico\") == \"true\"){chamaLegenda(\"" + thisJson.tematicoLegenda + "\")}' class='divLegenda' alt='legenda'><label class='lblLayerSwitcherItem' title='" + thisJson.tooltip + "'>" + "&nbsp;<img src='../css/img/icones/download_icone.png' class='divLegenda' title='Clique para fazer o download da camada' " + (thisJson.Download.habilitaDownload === "false" || thisJson.Download.habilitaDownload === "" ? "style='display:none;'" : "") + " onclick='" + (thisJson.Download.habilitaDownload === "trueGEOSERVER" ? "alternaDropdown(event," + thisJson.layerID + ");" : (thisJson.Download.habilitaDownload === "trueNAS" ? "_downloadArquivos(); globalctlBtnDownloadArquivos.panel_div.className = \"ctlBtnDownloadArquivosItemActive olButton\";" : "")) + "'>" + (thisJson.Metadado.habilitaMetadado === "true" ? "<img src='../css/img/icones/metadados_icone.png' class='divLegenda' title='Clique para visualizar os metadados' " + "onclick='chamarMetadados(\"" + thisJson.Metadado.idMetadado + "\");'>" : "") + thisJson.layerLabel + "</label><div id='dropdown_" + thisJson.layerID + "' class='dropdown-menu' style='display: none;'>" + "<ul>" + "<li data-type='SHAPE-ZIP' onclick='downloadArquivo(\"" + thisJson.info.infoLayer + "\", \"SHAPE-ZIP\", \"" + thisJson.info.tipo + "\")'>SHP</li>" + "<li data-type='application%2Fvnd.google-earth.kml%2Bxml' onclick='downloadArquivo(\"" + thisJson.info.infoLayer + "\", \"application%2Fvnd.google-earth.kml%2Bxml\",  \"" + thisJson.info.tipo + "\")'>KML</li>" + "<li data-type='application%2Fjson' onclick='downloadArquivo(\"" + thisJson.info.infoLayer + "\", \"application%2Fjson\",  \"" + thisJson.info.tipo + "\")'>GeoJson</li>" + "<li data-type='application%2Fx-gpkg' onclick='downloadArquivo(\"" + thisJson.info.infoLayer + "\", \"application%2Fx-gpkg\",  \"" + thisJson.info.tipo + "\")'>GPKG</li>" + "</ul>" + "</div>" + "</td></tr></table></div>";
                } else {
                    //16-02-2016
                    if (rotuloAtivo = true) {
                        htmlDinamico = htmlDinamico + ">" + "<img src='../js/img/switcher-off.png' id='img_" + thisJson.layerID + "' class='divRotulo' status='on' permitido = 'false' onclick='chaveiaRotulos(" + thisJson.layerID + ");'><img src='" + thisJson.legenda + "' tematico='" + thisJson.tematico + "'srcTematico='" + thisJson.tematicoLegenda + "' onclick='javascript: if (this.getAttribute(\"tematico\") == \"true\"){chamaLegenda(\"" + thisJson.tematicoLegenda + "\")}' class='divLegenda' alt='legenda'><label class='lblLayerSwitcherItem' title='" + thisJson.tooltip + "'>" + "&nbsp;<img src='../css/img/icones/download_icone.png' class='divLegenda' title='Clique para fazer o download da camada' " + (thisJson.Download.habilitaDownload === "false" || thisJson.Download.habilitaDownload === "" ? "style='display:none;'" : "") + " onclick='" + (thisJson.Download.habilitaDownload === "trueGEOSERVER" ? "alternaDropdown(event," + thisJson.layerID + ");" : (thisJson.Download.habilitaDownload === "trueNAS" ? "_downloadArquivos(); globalctlBtnDownloadArquivos.panel_div.className = \"ctlBtnDownloadArquivosItemActive olButton\";" : "")) + "'>" + (thisJson.Metadado.habilitaMetadado === "true" ? "<img src='../css/img/icones/metadados_icone.png' class='divLegenda' title='Clique para visualizar os metadados' " + "onclick='chamarMetadados(\"" + thisJson.Metadado.idMetadado + "\");'>" : "") + thisJson.layerLabel + "</label><div id='dropdown_" + thisJson.layerID + "' class='dropdown-menu' style='display: none;'>" + "<ul>" + "<li data-type='SHAPE-ZIP' onclick='downloadArquivo(\"" + thisJson.info.infoLayer + "\", \"SHAPE-ZIP\", \"" + thisJson.info.tipo + "\")'>SHP</li>" + "<li data-type='application%2Fvnd.google-earth.kml%2Bxml' onclick='downloadArquivo(\"" + thisJson.info.infoLayer + "\", \"application%2Fvnd.google-earth.kml%2Bxml\",  \"" + thisJson.info.tipo + "\")'>KML</li>" + "<li data-type='application%2Fjson' onclick='downloadArquivo(\"" + thisJson.info.infoLayer + "\", \"application%2Fjson\",  \"" + thisJson.info.tipo + "\")'>GeoJson</li>" + "<li data-type='application%2Fx-gpkg' onclick='downloadArquivo(\"" + thisJson.info.infoLayer + "\", \"application%2Fx-gpkg\",  \"" + thisJson.info.tipo + "\")'>GPKG</li>" + "</ul>" + "</div>" + "</td></tr></table></div>";
                    } else {
                        htmlDinamico = htmlDinamico + ">" + "<img src='../js/img/switcher-off.png' id='img_" + thisJson.layerID + "' class='divRotulo' status='off' permitido = 'false' onclick='chaveiaRotulos(" + thisJson.layerID + ");'><img src='" + thisJson.legenda + "' tematico='" + thisJson.tematico + "'srcTematico='" + thisJson.tematicoLegenda + "' onclick='javascript: if (this.getAttribute(\"tematico\") == \"true\"){chamaLegenda(\"" + thisJson.tematicoLegenda + "\")}' class='divLegenda' alt='legenda'><label class='lblLayerSwitcherItem' title='" + thisJson.tooltip + "'>" + "&nbsp;<img src='../css/img/icones/download_icone.png' class='divLegenda' title='Clique para fazer o download da camada' " + (thisJson.Download.habilitaDownload === "false" || thisJson.Download.habilitaDownload === "" ? "style='display:none;'" : "") + " onclick='" + (thisJson.Download.habilitaDownload === "trueGEOSERVER" ? "alternaDropdown(event," + thisJson.layerID + ");" : (thisJson.Download.habilitaDownload === "trueNAS" ? "_downloadArquivos(); globalctlBtnDownloadArquivos.panel_div.className = \"ctlBtnDownloadArquivosItemActive olButton\";" : "")) + "'>" + (thisJson.Metadado.habilitaMetadado === "true" ? "<img src='../css/img/icones/metadados_icone.png' class='divLegenda' title='Clique para visualizar os metadados' " + "onclick='chamarMetadados(\"" + thisJson.Metadado.idMetadado + "\");'>" : "") + thisJson.layerLabel + "</label><div id='dropdown_" + thisJson.layerID + "' class='dropdown-menu' style='display: none;'>" + "<ul>" + "<li data-type='SHAPE-ZIP' onclick='downloadArquivo(\"" + thisJson.info.infoLayer + "\", \"SHAPE-ZIP\", \"" + thisJson.info.tipo + "\")'>SHP</li>" + "<li data-type='application%2Fvnd.google-earth.kml%2Bxml' onclick='downloadArquivo(\"" + thisJson.info.infoLayer + "\", \"application%2Fvnd.google-earth.kml%2Bxml\",  \"" + thisJson.info.tipo + "\")'>KML</li>" + "<li data-type='application%2Fjson' onclick='downloadArquivo(\"" + thisJson.info.infoLayer + "\", \"application%2Fjson\",  \"" + thisJson.info.tipo + "\")'>GeoJson</li>" + "<li data-type='application%2Fx-gpkg' onclick='downloadArquivo(\"" + thisJson.info.infoLayer + "\", \"application%2Fx-gpkg\",  \"" + thisJson.info.tipo + "\")'>GPKG</li>" + "</ul>" + "</div>" + "</td></tr></table></div>";
                    }
                    //16-02-2016

                }
            } else {
                htmlDinamico = htmlDinamico + " indiceRotulo = ''";
                htmlDinamico = htmlDinamico + " zoomRotulo = '#'";
                htmlDinamico = htmlDinamico + ">" + "<img src='../js/img/switcher-none.png' id='img_" + thisJson.layerID + "' class='divRotulo' status='none' permitido = 'false' onclick='chaveiaRotulos(" + thisJson.layerID + ");'><img src='" + thisJson.legenda + "' tematico='" + thisJson.tematico + "'srcTematico='" + thisJson.tematicoLegenda + "' onclick='javascript: if (this.getAttribute(\"tematico\") == \"true\"){chamaLegenda(\"" + thisJson.tematicoLegenda + "\")}' class='divLegenda' alt='legenda'><label class='lblLayerSwitcherItem' title='" + thisJson.tooltip + "'>" + "&nbsp;<img src='../css/img/icones/download_icone.png' class='divLegenda' title='Clique para fazer o download da camada' " + (thisJson.Download.habilitaDownload === "false" || thisJson.Download.habilitaDownload === "" ? "style='display:none;'" : "") + " onclick='" + (thisJson.Download.habilitaDownload === "trueGEOSERVER" ? "alternaDropdown(event," + thisJson.layerID + ");" : (thisJson.Download.habilitaDownload === "trueNAS" ? "_downloadArquivos(); globalctlBtnDownloadArquivos.panel_div.className = \"ctlBtnDownloadArquivosItemActive olButton\";" : "")) + "'>" + (thisJson.Metadado.habilitaMetadado === "true" ? "<img src='../css/img/icones/metadados_icone.png' class='divLegenda' title='Clique para visualizar os metadados' " + "onclick='chamarMetadados(\"" + thisJson.Metadado.idMetadado + "\");'>" : "") + thisJson.layerLabel + "</label><div id='dropdown_" + thisJson.layerID + "' class='dropdown-menu' style='display: none;'>" + "<ul>" + "<li data-type='SHAPE-ZIP' onclick='downloadArquivo(\"" + thisJson.info.infoLayer + "\", \"SHAPE-ZIP\", \"" + thisJson.info.tipo + "\")'>SHP</li>" + "<li data-type='application%2Fvnd.google-earth.kml%2Bxml' onclick='downloadArquivo(\"" + thisJson.info.infoLayer + "\", \"application%2Fvnd.google-earth.kml%2Bxml\",  \"" + thisJson.info.tipo + "\")'>KML</li>" + "<li data-type='application%2Fjson' onclick='downloadArquivo(\"" + thisJson.info.infoLayer + "\", \"application%2Fjson\",  \"" + thisJson.info.tipo + "\")'>GeoJson</li>" + "<li data-type='application%2Fx-gpkg' onclick='downloadArquivo(\"" + thisJson.info.infoLayer + "\", \"application%2Fx-gpkg\",  \"" + thisJson.info.tipo + "\")'>GPKG</li>" + "</ul>" + "</div>" + "</td></tr></table></div>";
            }

            //FIM Rótulos
            //************************************************************************

            //htmlDinamicoTotal = htmlDinamico + htmlDinamicoTotal;
            htmlDinamicoTotal = htmlDinamicoTotal + htmlDinamico;  //10102014
            htmlDinamico = "";
        } else if (tipo == "grupo") {

            var labelAgrupador = "";

            //Monta o checkbox na DIV para cara registro
            indexGrupo = indexGrupo + 1;

            //controla visibilidade dos checkbox de acordo com o zoom
            var arrayZoomExib = thisJson.aparencia.zoomExib.split("#");
            //cria um tooltip mostrando em que níveis de zoom será mostrado
            var tooltip = 'Zoom de vizualização: ' + (thisJson.aparencia.zoomExib).replace('#', ',');

            //if ($.inArray(zoomAtual.toString(), arrayZoomExib) != -1 && this.ocultavel == 'false') {
            if (thisJson.ocultavel == 'false') {
                htmlDinamico = htmlDinamico + "<div style='display:block;' id='div_" + thisJson.layerID + "'><table><tr><td class='tdLayers'>";
                htmlDinamico = htmlDinamico + "<a href=\'javascript: treeControl(" + "\"" + thisJson.layerID + "\"" + ")\'>";
                htmlDinamico = htmlDinamico + "<img src='../js/img/plusbottom.gif' border='0' id='btnMaisMenos_" + thisJson.layerID + "'>";
                htmlDinamico = htmlDinamico + "</a>";
                htmlDinamico = htmlDinamico + "<input style='visibility: hidden; width: 1px;height: 1px;' id='" + thisJson.layerID + "' name='chkLayers' type='checkbox' indice='G' indicegrupo='" + (indexGrupo) + "' indicesubgrupo='' agrupador='true' tipoControle='G' onchange='chkChange(this)' ";
            } else {
                htmlDinamico = htmlDinamico + "<div style='display:none;' id='div_" + thisJson.layerID + "'><table><tr><td class='tdLayers'>";
                htmlDinamico = htmlDinamico + "<a href=\'javascript: treeControl(" + "\"" + thisJson.layerID + "\"" + ")\'>";
                htmlDinamico = htmlDinamico + "<img src='../js/img/plusbottom.gif' border='0' id='btnMaisMenos_" + thisJson.layerID + "'>";
                htmlDinamico = htmlDinamico + "</a>";
                htmlDinamico = htmlDinamico + "<input style='visibility: hidden; width: 1px;height: 1px;' id='" + thisJson.layerID + "' name='chkLayers' type='checkbox' indice='G' indicegrupo='" + (indexGrupo) + "' indicesubgrupo='' agrupador='true' tipoControle='G' onchange='chkChange(this)' ";
            }


            //cria atributo de ocultável ou não
            htmlDinamico = htmlDinamico + "ocultavel= '" + thisJson.ocultavel + "' ";


            //Se for readOnly desabilita o chkbox e cria atributo somenteleitura
            if (thisJson.aparencia.readOnly == 'true') {
                htmlDinamico = htmlDinamico + " disabled = 'true' somenteleitura='true' ";
            } else {
                htmlDinamico = htmlDinamico + " somenteleitura='false' ";
            }

            if (thisJson.aparencia.visible == 'true') {
                htmlDinamico = htmlDinamico + "checked><label class='lblLayerSwitcherItem' title='" + thisJson.tooltip + "'>" + thisJson.layerLabel + "</label></td></tr></table></div>";
                //Cria array com camadas que devem ser exibidas de acordo com o arquivo de configuração
                ////layersVisiveis.push(indexArrayLayers);
            } else {
                htmlDinamico = htmlDinamico + "><label class='lblLayerSwitcherItem' title='" + thisJson.tooltip + "'>" + thisJson.layerLabel + "</label></td></tr></table></div>";
                //Cria array com camadas que não devem ser exibidas de acordo com o arquivo de configuração
                ////layersInvisiveis.push(indexArrayLayers);
            }


            labelAgrupador = thisJson.layerLabel;

        } else if (tipo == "subitem") {
            //Só lê registros ativos
            //Só lê registros ativos
            if (thisJson.ativo == 'true') {

                layers.push(eval(chamaLayerEspecifico(thisJson.layerID, thisJson.conexao.tipo, thisJson.conexao.src, thisJson.conexao.base, thisJson.conexao.namespace, baselayer, thisJson.legenda, thisJson.tematico, thisJson.tematicoLegenda, labelAgrupador + " " + thisJson.layerLabel, layers.length, parseInt(thisJson.ordemExib) + fatorBasesAdicionados, thisJson.conexao.style)));
                indexArrayLayers = layers.length - 1;
                //indexArrayLayers = parseInt(this.ordemExib) + fatorBasesAdicionados;

                //controla visibilidade dos checkbox de acordo com o zoom
                //Monta o checkbox na DIV para cara registro
                var arrayZoomExib = thisJson.aparencia.zoomExib.split("#");
                //cria um tooltip mostrando em que níveis de zoom será mostrado
                var tooltip = 'Zoom de vizualização: ' + (thisJson.aparencia.zoomExib).replace('#', ',');

                //if ($.inArray(zoomAtual.toString(), arrayZoomExib) != -1) {
                if (thisJson.ocultavel == 'false') {
                    htmlDinamicoItens = htmlDinamicoItens + "<div style='display:block;' id='div_" + thisJson.layerID + "'><table><tr><td class='tdLayers'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<input id='" + thisJson.layerID + "' name='chkLayers' type='checkbox' indice='" + indexArrayLayers + "' indicegrupo='" + indexGrupo + "' indicesubgrupo='' agrupador='false' tipoControle='SI' onchange='chkChange(this)' ";
                } else {
                    htmlDinamicoItens = htmlDinamicoItens + "<div style='display:none;' id='div_" + thisJson.layerID + "'><table><tr><td class='tdLayers'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<input id='" + thisJson.layerID + "' name='chkLayers' type='checkbox' indice='" + indexArrayLayers + "' indicegrupo='" + indexGrupo + "' indicesubgrupo='' agrupador='false' tipoControle='SI' onchange='chkChange(this)' ";
                }

                //Se for readOnly desabilita o chkbox e cria atributo somenteleitura
                if (thisJson.aparencia.readOnly == 'true') {
                    htmlDinamicoItens = htmlDinamicoItens + " disabled = 'true' somenteleitura='true' ";
                } else {
                    htmlDinamicoItens = htmlDinamicoItens + " somenteleitura='false' ";
                }

                if (thisJson.aparencia.visible == 'true') {
                    htmlDinamicoItens = htmlDinamicoItens + "checked ";
                    //Cria array com camadas que devem ser exibidas de acordo com o arquivo de configuração
                    var arrayZoomExib = thisJson.aparencia.zoomExib.split("#");
                    if ($.inArray(zoomAtual.toString(), arrayZoomExib) != -1) {
                        layersVisiveis.push(indexArrayLayers);
                    } else {
                        layersInvisiveis.push(indexArrayLayers);
                    }
                } else {
                    //Cria array com camadas que não devem ser exibidas de acordo com o arquivo de configuração
                    layersInvisiveis.push(indexArrayLayers);
                }


                //Se for readOnly desabilita o chkbox e cria atributo somenteleitura
                if (thisJson.aparencia.visible == 'true') {
                    layersCargaInicialMapa.push(indexArrayLayers);
                }

                //cria atributo de ocultável ou não
                htmlDinamicoItens = htmlDinamicoItens + "ocultavel= '" + thisJson.ocultavel + "' ";

                //cria propriedades de zoomMax e zoomMin no controle
                htmlDinamicoItens = htmlDinamicoItens + " zoomExib = '" + thisJson.aparencia.zoomExib + "' ";

                //************************************************************************
                //Verifica se existe rótulo, cria o vetor e joga o indice dele na propriedade do checkbox do Layer associado
                var vetorIndex = '';
                var exibe = false;
                var rotuloAtivo = false; //16-02-2016

                if (thisJson.rotulo.ativo == 'true') {
                    //layers.push(eval(chamaVectorEspecifico(this.transparent, this.request, this.service, this.typeName, this.featureType, this.geometryName, this.vector, this.style)));
                    layers.push(eval(chamaLayerEspecifico(thisJson.rotulo.layerID, thisJson.rotulo.conexao.tipo, thisJson.rotulo.conexao.src, thisJson.rotulo.conexao.base, thisJson.rotulo.conexao.namespace, baselayer, thisJson.legenda, thisJson.tematico, thisJson.tematicoLegenda, labelAgrupador + " " + thisJson.layerLabel, layers.length, parseInt(thisJson.ordemExib) + fatorBasesAdicionados + 0.5, thisJson.rotulo.conexao.style)));
                    vetorIndex = layers.length - 1;
                    //vetorIndex = parseInt(this.ordemExib) + fatorBasesAdicionados + 0.5;
                    rotuloAtivo = true; //16-02-2016

                    var arrayZoomExibRot = thisJson.rotulo.aparencia.zoomExib.split("#");
                    if ($.inArray(zoomAtual.toString(), arrayZoomExibRot) != -1) {
                        layersVisiveis.push(indexArrayLayers);
                        var exibe = true;
                    } else {
                        layersInvisiveis.push(indexArrayLayers);
                    }
                }

                if (vetorIndex != '') {
                    htmlDinamicoItens = htmlDinamicoItens + " indiceRotulo='" + vetorIndex + "' ";
                    htmlDinamicoItens = htmlDinamicoItens + " zoomRotulo='" + thisJson.rotulo.aparencia.zoomExib + "' ";
                } else {
                    htmlDinamicoItens = htmlDinamicoItens + " indiceRotulo = ''";
                    htmlDinamicoItens = htmlDinamicoItens + " zoomRotulo = '#'";
                }

                if (vetorIndex != '') {
                    htmlDinamicoItens = htmlDinamicoItens + " indiceRotulo='" + vetorIndex + "' ";
                    htmlDinamicoItens = htmlDinamicoItens + " zoomRotulo='" + thisJson.rotulo.aparencia.zoomExib + "' ";
                    //cria o botão do rótulo
                    if (exibe == true) {
                        htmlDinamicoItens = htmlDinamicoItens + ">" + "<img src='../js/img/switcher-on.png' id='img_" + thisJson.layerID + "' class='divRotulo' status='on' permitido = 'true' onclick='chaveiaRotulos(" + thisJson.layerID + ");'><img src='" + thisJson.legenda + "' tematico='" + thisJson.tematico + "'srcTematico='" + thisJson.tematicoLegenda + "' onclick='javascript: if (this.getAttribute(\"tematico\") == \"true\"){chamaLegenda(\"" + thisJson.tematicoLegenda + "\")}' class='divLegenda' alt='legenda'><label class='lblLayerSwitcherItem' title='" + thisJson.tooltip + "'>" + "&nbsp;<img src='../css/img/icones/download_icone.png' class='divLegenda' title='Clique para fazer o download da camada' " + (thisJson.Download.habilitaDownload === "false" || thisJson.Download.habilitaDownload === "" ? "style='display:none;'" : "") + " onclick='" + (thisJson.Download.habilitaDownload === "trueGEOSERVER" ? "alternaDropdown(event," + thisJson.layerID + ");" : (thisJson.Download.habilitaDownload === "trueNAS" ? "_downloadArquivos(); globalctlBtnDownloadArquivos.panel_div.className = \"ctlBtnDownloadArquivosItemActive olButton\";" : "")) + "'>" + (thisJson.Metadado.habilitaMetadado === "true" ? "<img src='../css/img/icones/metadados_icone.png' class='divLegenda' title='Clique para visualizar os metadados' " + "onclick='chamarMetadados(\"" + thisJson.Metadado.idMetadado + "\");'>" : "") + thisJson.layerLabel + "</label><div id='dropdown_" + thisJson.layerID + "' class='dropdown-menu' style='display: none;'>" + "<ul>" + "<li data-type='SHAPE-ZIP' onclick='downloadArquivo(\"" + thisJson.info.infoLayer + "\", \"SHAPE-ZIP\", \"" + thisJson.info.tipo + "\")'>SHP</li>" + "<li data-type='application%2Fvnd.google-earth.kml%2Bxml' onclick='downloadArquivo(\"" + thisJson.info.infoLayer + "\", \"application%2Fvnd.google-earth.kml%2Bxml\",  \"" + thisJson.info.tipo + "\")'>KML</li>" + "<li data-type='application%2Fjson' onclick='downloadArquivo(\"" + thisJson.info.infoLayer + "\", \"application%2Fjson\",  \"" + thisJson.info.tipo + "\")'>GeoJson</li>" + "<li data-type='application%2Fx-gpkg' onclick='downloadArquivo(\"" + thisJson.info.infoLayer + "\", \"application%2Fx-gpkg\",  \"" + thisJson.info.tipo + "\")'>GPKG</li>" + "</ul>" + "</div>" + "</td></tr></table></div>";
                    } else {
                        //16-02-2016
                        if (rotuloAtivo = true) {
                            htmlDinamicoItens = htmlDinamicoItens + ">" + "<img src='../js/img/switcher-off.png' id='img_" + thisJson.layerID + "' class='divRotulo' status='on' permitido = 'false' onclick='chaveiaRotulos(" + thisJson.layerID + ");'><img src='" + thisJson.legenda + "' tematico='" + thisJson.tematico + "'srcTematico='" + thisJson.tematicoLegenda + "' onclick='javascript: if (this.getAttribute(\"tematico\") == \"true\"){chamaLegenda(\"" + thisJson.tematicoLegenda + "\")}' class='divLegenda' alt='legenda'><label class='lblLayerSwitcherItem' title='" + thisJson.tooltip + "'>" + "&nbsp;<img src='../css/img/icones/download_icone.png' class='divLegenda' title='Clique para fazer o download da camada' " + (thisJson.Download.habilitaDownload === "false" || thisJson.Download.habilitaDownload === "" ? "style='display:none;'" : "") + " onclick='" + (thisJson.Download.habilitaDownload === "trueGEOSERVER" ? "alternaDropdown(event," + thisJson.layerID + ");" : (thisJson.Download.habilitaDownload === "trueNAS" ? "_downloadArquivos(); globalctlBtnDownloadArquivos.panel_div.className = \"ctlBtnDownloadArquivosItemActive olButton\";" : "")) + "'>" + (thisJson.Metadado.habilitaMetadado === "true" ? "<img src='../css/img/icones/metadados_icone.png' class='divLegenda' title='Clique para visualizar os metadados' " + "onclick='chamarMetadados(\"" + thisJson.Metadado.idMetadado + "\");'>" : "") + thisJson.layerLabel + "</label><div id='dropdown_" + thisJson.layerID + "' class='dropdown-menu' style='display: none;'>" + "<ul>" + "<li data-type='SHAPE-ZIP' onclick='downloadArquivo(\"" + thisJson.info.infoLayer + "\", \"SHAPE-ZIP\", \"" + thisJson.info.tipo + "\")'>SHP</li>" + "<li data-type='application%2Fvnd.google-earth.kml%2Bxml' onclick='downloadArquivo(\"" + thisJson.info.infoLayer + "\", \"application%2Fvnd.google-earth.kml%2Bxml\",  \"" + thisJson.info.tipo + "\")'>KML</li>" + "<li data-type='application%2Fjson' onclick='downloadArquivo(\"" + thisJson.info.infoLayer + "\", \"application%2Fjson\",  \"" + thisJson.info.tipo + "\")'>GeoJson</li>" + "<li data-type='application%2Fx-gpkg' onclick='downloadArquivo(\"" + thisJson.info.infoLayer + "\", \"application%2Fx-gpkg\",  \"" + thisJson.info.tipo + "\")'>GPKG</li>" + "</ul>" + "</div>" + "</td></tr></table></div>";
                        } else {
                            htmlDinamicoItens = htmlDinamicoItens + ">" + "<img src='../js/img/switcher-off.png' id='img_" + thisJson.layerID + "' class='divRotulo' status='off' permitido = 'false' onclick='chaveiaRotulos(" + thisJson.layerID + ");'><img src='" + thisJson.legenda + "' tematico='" + thisJson.tematico + "'srcTematico='" + thisJson.tematicoLegenda + "' onclick='javascript: if (this.getAttribute(\"tematico\") == \"true\"){chamaLegenda(\"" + thisJson.tematicoLegenda + "\")}' class='divLegenda' alt='legenda'><label class='lblLayerSwitcherItem' title='" + thisJson.tooltip + "'>" + "&nbsp;<img src='../css/img/icones/download_icone.png' class='divLegenda' title='Clique para fazer o download da camada' " + (thisJson.Download.habilitaDownload === "false" || thisJson.Download.habilitaDownload === "" ? "style='display:none;'" : "") + " onclick='" + (thisJson.Download.habilitaDownload === "trueGEOSERVER" ? "alternaDropdown(event," + thisJson.layerID + ");" : (thisJson.Download.habilitaDownload === "trueNAS" ? "_downloadArquivos(); globalctlBtnDownloadArquivos.panel_div.className = \"ctlBtnDownloadArquivosItemActive olButton\";" : "")) + "'>" + (thisJson.Metadado.habilitaMetadado === "true" ? "<img src='../css/img/icones/metadados_icone.png' class='divLegenda' title='Clique para visualizar os metadados' " + "onclick='chamarMetadados(\"" + thisJson.Metadado.idMetadado + "\");'>" : "") + thisJson.layerLabel + "</label><div id='dropdown_" + thisJson.layerID + "' class='dropdown-menu' style='display: none;'>" + "<ul>" + "<li data-type='SHAPE-ZIP' onclick='downloadArquivo(\"" + thisJson.info.infoLayer + "\", \"SHAPE-ZIP\", \"" + thisJson.info.tipo + "\")'>SHP</li>" + "<li data-type='application%2Fvnd.google-earth.kml%2Bxml' onclick='downloadArquivo(\"" + thisJson.info.infoLayer + "\", \"application%2Fvnd.google-earth.kml%2Bxml\",  \"" + thisJson.info.tipo + "\")'>KML</li>" + "<li data-type='application%2Fjson' onclick='downloadArquivo(\"" + thisJson.info.infoLayer + "\", \"application%2Fjson\",  \"" + thisJson.info.tipo + "\")'>GeoJson</li>" + "<li data-type='application%2Fx-gpkg' onclick='downloadArquivo(\"" + thisJson.info.infoLayer + "\", \"application%2Fx-gpkg\",  \"" + thisJson.info.tipo + "\")'>GPKG</li>" + "</ul>" + "</div>" + "</td></tr></table></div>";
                        }
                        //16-02-2016
                    }
                } else {
                    htmlDinamicoItens = htmlDinamicoItens + " indiceRotulo = ''";
                    htmlDinamicoItens = htmlDinamicoItens + " zoomRotulo = '#'";
                    htmlDinamicoItens = htmlDinamicoItens + ">" + "<img src='../js/img/switcher-none.png' id='img_" + thisJson.layerID + "' class='divRotulo' status='none' permitido = 'false' onclick='chaveiaRotulos(" + thisJson.layerID + ");'><img src='" + thisJson.legenda + "' tematico='" + thisJson.tematico + "'srcTematico='" + thisJson.tematicoLegenda + "' onclick='javascript: if (this.getAttribute(\"tematico\") == \"true\"){chamaLegenda(\"" + thisJson.tematicoLegenda + "\")}' class='divLegenda' alt='legenda'><label class='lblLayerSwitcherItem' title='" + thisJson.tooltip + "'>" + "&nbsp;<img src='../css/img/icones/download_icone.png' class='divLegenda' title='Clique para fazer o download da camada' " + (thisJson.Download.habilitaDownload === "false" || thisJson.Download.habilitaDownload === "" ? "style='display:none;'" : "") + " onclick='" + (thisJson.Download.habilitaDownload === "trueGEOSERVER" ? "alternaDropdown(event," + thisJson.layerID + ");" : (thisJson.Download.habilitaDownload === "trueNAS" ? "_downloadArquivos(); globalctlBtnDownloadArquivos.panel_div.className = \"ctlBtnDownloadArquivosItemActive olButton\";" : "")) + "'>" + (thisJson.Metadado.habilitaMetadado === "true" ? "<img src='../css/img/icones/metadados_icone.png' class='divLegenda' title='Clique para visualizar os metadados' " + "onclick='chamarMetadados(\"" + thisJson.Metadado.idMetadado + "\");'>" : "") + thisJson.layerLabel + "</label><div id='dropdown_" + thisJson.layerID + "' class='dropdown-menu' style='display: none;'>" + "<ul>" + "<li data-type='SHAPE-ZIP' onclick='downloadArquivo(\"" + thisJson.info.infoLayer + "\", \"SHAPE-ZIP\", \"" + thisJson.info.tipo + "\")'>SHP</li>" + "<li data-type='application%2Fvnd.google-earth.kml%2Bxml' onclick='downloadArquivo(\"" + thisJson.info.infoLayer + "\", \"application%2Fvnd.google-earth.kml%2Bxml\",  \"" + thisJson.info.tipo + "\")'>KML</li>" + "<li data-type='application%2Fjson' onclick='downloadArquivo(\"" + thisJson.info.infoLayer + "\", \"application%2Fjson\",  \"" + thisJson.info.tipo + "\")'>GeoJson</li>" + "<li data-type='application%2Fx-gpkg' onclick='downloadArquivo(\"" + thisJson.info.infoLayer + "\", \"application%2Fx-gpkg\",  \"" + thisJson.info.tipo + "\")'>GPKG</li>" + "</ul>" + "</div>" + "</td></tr></table></div>";
                }

                //FIM Rótulos
                //************************************************************************

                //htmlDinamicoGrupo = htmlDinamicoItens + htmlDinamicoGrupo; //10102014
                htmlDinamicoGrupo = htmlDinamicoGrupo + htmlDinamicoItens;
                htmlDinamicoItens = "";

            } //fim ativo

        } else if (tipo == "subitem2") {
            //Só lê registros ativos
            //Só lê registros ativos
            if (thisJson.ativo == 'true') {

                layers.push(eval(chamaLayerEspecifico(thisJson.layerID, thisJson.conexao.tipo, thisJson.conexao.src, thisJson.conexao.base, thisJson.conexao.namespace, baselayer, thisJson.legenda, thisJson.tematico, thisJson.tematicoLegenda, labelAgrupador + " " + thisJson.layerLabel, layers.length, parseInt(thisJson.ordemExib) + fatorBasesAdicionados, thisJson.conexao.style)));
                indexArrayLayers = layers.length - 1;
                //indexArrayLayers = parseInt(this.ordemExib) + fatorBasesAdicionados;

                //controla visibilidade dos checkbox de acordo com o zoom
                //Monta o checkbox na DIV para cara registro
                var arrayZoomExib = thisJson.aparencia.zoomExib.split("#");
                //cria um tooltip mostrando em que níveis de zoom será mostrado
                var tooltip = 'Zoom de vizualização: ' + (thisJson.aparencia.zoomExib).replace('#', ',');

                //if ($.inArray(zoomAtual.toString(), arrayZoomExib) != -1) {
                if (thisJson.ocultavel == 'false') {
                    htmlDinamicoSubItens = htmlDinamicoSubItens + "<div style='display:block;' id='div_" + thisJson.layerID + "'><table><tr><td class='tdLayers'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<input id='" + thisJson.layerID + "' name='chkLayers' type='checkbox' indice='" + indexArrayLayers + "' indicegrupo='" + indexGrupo + "' indicesubgrupo='" + indexSubGrupo + "' agrupador='false' tipoControle='SI2' onchange='chkChange(this)' ";
                } else {
                    htmlDinamicoSubItens = htmlDinamicoSubItens + "<div style='display:none;' id='div_" + thisJson.layerID + "'><table><tr><td class='tdLayers'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<input id='" + thisJson.layerID + "' name='chkLayers' type='checkbox' indice='" + indexArrayLayers + "' indicegrupo='" + indexGrupo + "' indicesubgrupo='" + indexSubGrupo + "' agrupador='false' tipoControle='SI2' onchange='chkChange(this)' ";
                }

                //Se for readOnly desabilita o chkbox e cria atributo somenteleitura
                if (thisJson.aparencia.readOnly == 'true') {
                    htmlDinamicoSubItens = htmlDinamicoSubItens + " disabled = 'true' somenteleitura='true' ";
                } else {
                    htmlDinamicoSubItens = htmlDinamicoSubItens + " somenteleitura='false' ";
                }

                if (thisJson.aparencia.visible == 'true') {
                    htmlDinamicoSubItens = htmlDinamicoSubItens + "checked ";
                    //Cria array com camadas que devem ser exibidas de acordo com o arquivo de configuração
                    var arrayZoomExib = thisJson.aparencia.zoomExib.split("#");
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
                htmlDinamicoSubItens = htmlDinamicoSubItens + "ocultavel= '" + thisJson.ocultavel + "' ";

                //cria propriedades de zoomMax e zoomMin no controle
                htmlDinamicoSubItens = htmlDinamicoSubItens + " zoomExib = '" + thisJson.aparencia.zoomExib + "' ";

                //************************************************************************
                //Verifica se existe rótulo, cria o vetor e joga o indice dele na propriedade do checkbox do Layer associado
                var vetorIndex = '';
                var exibe = false;
                var rotuloAtivo = false; //16-02-2016

                if (thisJson.rotulo.ativo == 'true') {
                    //layers.push(eval(chamaVectorEspecifico(this.transparent, this.request, this.service, this.typeName, this.featureType, this.geometryName, this.vector, this.style)));
                    layers.push(eval(chamaLayerEspecifico(thisJson.rotulo.layerID, thisJson.rotulo.conexao.tipo, thisJson.rotulo.conexao.src, thisJson.rotulo.conexao.base, thisJson.rotulo.conexao.namespace, baselayer, thisJson.legenda, thisJson.tematico, thisJson.tematicoLegenda, labelAgrupador + " " + thisJson.layerLabel, layers.length, parseInt(thisJson.ordemExib) + fatorBasesAdicionados + 0.5, thisJson.rotulo.conexao.style)));
                    vetorIndex = layers.length - 1;
                    //vetorIndex = parseInt(this.ordemExib) + fatorBasesAdicionados + 0.5;
                    rotuloAtivo = true; //16-02-2016

                    var arrayZoomExibRot = thisJson.rotulo.aparencia.zoomExib.split("#");
                    if ($.inArray(zoomAtual.toString(), arrayZoomExibRot) != -1) {
                        layersVisiveis.push(indexArrayLayers);
                        var exibe = true;
                    } else {
                        layersInvisiveis.push(indexArrayLayers);
                    }
                }

                if (vetorIndex != '') {
                    htmlDinamicoSubItens = htmlDinamicoSubItens + " indiceRotulo='" + vetorIndex + "' ";
                    htmlDinamicoSubItens = htmlDinamicoSubItens + " zoomRotulo='" + thisJson.rotulo.aparencia.zoomExib + "' ";
                } else {
                    htmlDinamicoSubItens = htmlDinamicoSubItens + " indiceRotulo = ''";
                    htmlDinamicoSubItens = htmlDinamicoSubItens + " zoomRotulo = '#'";
                }

                if (vetorIndex != '') {
                    htmlDinamicoSubItens = htmlDinamicoSubItens + " indiceRotulo='" + vetorIndex + "' ";
                    htmlDinamicoSubItens = htmlDinamicoSubItens + " zoomRotulo='" + thisJson.rotulo.aparencia.zoomExib + "' ";
                    //cria o botão do rótulo
                    if (exibe == true) {
                        htmlDinamicoSubItens = htmlDinamicoSubItens + ">" + "<img src='../js/img/switcher-on.png' id='img_" + thisJson.layerID + "' class='divRotulo' status='on' permitido = 'true' onclick='chaveiaRotulos(" + thisJson.layerID + ");'><img src='" + thisJson.legenda + "' tematico='" + thisJson.tematico + "'srcTematico='" + thisJson.tematicoLegenda + "' onclick='javascript: if (this.getAttribute(\"tematico\") == \"true\"){chamaLegenda(\"" + thisJson.tematicoLegenda + "\")}' class='divLegenda' alt='legenda'><label class='lblLayerSwitcherItem' title='" + thisJson.tooltip + "'>" + "&nbsp;<img src='../css/img/icones/download_icone.png' class='divLegenda' title='Clique para fazer o download da camada' " + (thisJson.Download.habilitaDownload === "false" || thisJson.Download.habilitaDownload === "" ? "style='display:none;'" : "") + " onclick='" + (thisJson.Download.habilitaDownload === "trueGEOSERVER" ? "alternaDropdown(event," + thisJson.layerID + ");" : (thisJson.Download.habilitaDownload === "trueNAS" ? "_downloadArquivos(); globalctlBtnDownloadArquivos.panel_div.className = \"ctlBtnDownloadArquivosItemActive olButton\";" : "")) + "'>" + (thisJson.Metadado.habilitaMetadado === "true" ? "<img src='../css/img/icones/metadados_icone.png' class='divLegenda' title='Clique para visualizar os metadados' " + "onclick='chamarMetadados(\"" + thisJson.Metadado.idMetadado + "\");'>" : "") + thisJson.layerLabel + "</label><div id='dropdown_" + thisJson.layerID + "' class='dropdown-menu' style='display: none;'>" + "<ul>" + "<li data-type='SHAPE-ZIP' onclick='downloadArquivo(\"" + thisJson.info.infoLayer + "\", \"SHAPE-ZIP\", \"" + thisJson.info.tipo + "\")'>SHP</li>" + "<li data-type='application%2Fvnd.google-earth.kml%2Bxml' onclick='downloadArquivo(\"" + thisJson.info.infoLayer + "\", \"application%2Fvnd.google-earth.kml%2Bxml\",  \"" + thisJson.info.tipo + "\")'>KML</li>" + "<li data-type='application%2Fjson' onclick='downloadArquivo(\"" + thisJson.info.infoLayer + "\", \"application%2Fjson\",  \"" + thisJson.info.tipo + "\")'>GeoJson</li>" + "<li data-type='application%2Fx-gpkg' onclick='downloadArquivo(\"" + thisJson.info.infoLayer + "\", \"application%2Fx-gpkg\",  \"" + thisJson.info.tipo + "\")'>GPKG</li>" + "</ul>" + "</div>" + "</td></tr></table></div>";
                    } else {
                        //16-02-2016
                        if (rotuloAtivo = true) {
                            htmlDinamicoSubItens = htmlDinamicoSubItens + ">" + "<img src='../js/img/switcher-off.png' id='img_" + thisJson.layerID + "' class='divRotulo' status='on' permitido = 'false' onclick='chaveiaRotulos(" + thisJson.layerID + ");'><img src='" + thisJson.legenda + "' tematico='" + thisJson.tematico + "'srcTematico='" + thisJson.tematicoLegenda + "' onclick='javascript: if (this.getAttribute(\"tematico\") == \"true\"){chamaLegenda(\"" + thisJson.tematicoLegenda + "\")}' class='divLegenda' alt='legenda'><label class='lblLayerSwitcherItem' title='" + thisJson.tooltip + "'>" + "&nbsp;<img src='../css/img/icones/download_icone.png' class='divLegenda' title='Clique para fazer o download da camada' " + (thisJson.Download.habilitaDownload === "false" || thisJson.Download.habilitaDownload === "" ? "style='display:none;'" : "") + " onclick='" + (thisJson.Download.habilitaDownload === "trueGEOSERVER" ? "alternaDropdown(event," + thisJson.layerID + ");" : (thisJson.Download.habilitaDownload === "trueNAS" ? "_downloadArquivos(); globalctlBtnDownloadArquivos.panel_div.className = \"ctlBtnDownloadArquivosItemActive olButton\";" : "")) + "'>" + (thisJson.Metadado.habilitaMetadado === "true" ? "<img src='../css/img/icones/metadados_icone.png' class='divLegenda' title='Clique para visualizar os metadados' " + "onclick='chamarMetadados(\"" + thisJson.Metadado.idMetadado + "\");'>" : "") + thisJson.layerLabel + "</label><div id='dropdown_" + thisJson.layerID + "' class='dropdown-menu' style='display: none;'>" + "<ul>" + "<li data-type='SHAPE-ZIP' onclick='downloadArquivo(\"" + thisJson.info.infoLayer + "\", \"SHAPE-ZIP\", \"" + thisJson.info.tipo + "\")'>SHP</li>" + "<li data-type='application%2Fvnd.google-earth.kml%2Bxml' onclick='downloadArquivo(\"" + thisJson.info.infoLayer + "\", \"application%2Fvnd.google-earth.kml%2Bxml\",  \"" + thisJson.info.tipo + "\")'>KML</li>" + "<li data-type='application%2Fjson' onclick='downloadArquivo(\"" + thisJson.info.infoLayer + "\", \"application%2Fjson\",  \"" + thisJson.info.tipo + "\")'>GeoJson</li>" + "<li data-type='application%2Fx-gpkg' onclick='downloadArquivo(\"" + thisJson.info.infoLayer + "\", \"application%2Fx-gpkg\",  \"" + thisJson.info.tipo + "\")'>GPKG</li>" + "</ul>" + "</div>" + "</td></tr></table></div>";
                        } else {
                            htmlDinamicoSubItens = htmlDinamicoSubItens + ">" + "<img src='../js/img/switcher-off.png' id='img_" + thisJson.layerID + "' class='divRotulo' status='off' permitido = 'false' onclick='chaveiaRotulos(" + thisJson.layerID + ");'><img src='" + thisJson.legenda + "' tematico='" + thisJson.tematico + "'srcTematico='" + thisJson.tematicoLegenda + "' onclick='javascript: if (this.getAttribute(\"tematico\") == \"true\"){chamaLegenda(\"" + thisJson.tematicoLegenda + "\")}' class='divLegenda' alt='legenda'><label class='lblLayerSwitcherItem' title='" + thisJson.tooltip + "'>" + "&nbsp;<img src='../css/img/icones/download_icone.png' class='divLegenda' title='Clique para fazer o download da camada' " + (thisJson.Download.habilitaDownload === "false" || thisJson.Download.habilitaDownload === "" ? "style='display:none;'" : "") + " onclick='" + (thisJson.Download.habilitaDownload === "trueGEOSERVER" ? "alternaDropdown(event," + thisJson.layerID + ");" : (thisJson.Download.habilitaDownload === "trueNAS" ? "_downloadArquivos(); globalctlBtnDownloadArquivos.panel_div.className = \"ctlBtnDownloadArquivosItemActive olButton\";" : "")) + "'>" + (thisJson.Metadado.habilitaMetadado === "true" ? "<img src='../css/img/icones/metadados_icone.png' class='divLegenda' title='Clique para visualizar os metadados' " + "onclick='chamarMetadados(\"" + thisJson.Metadado.idMetadado + "\");'>" : "") + thisJson.layerLabel + "</label><div id='dropdown_" + thisJson.layerID + "' class='dropdown-menu' style='display: none;'>" + "<ul>" + "<li data-type='SHAPE-ZIP' onclick='downloadArquivo(\"" + thisJson.info.infoLayer + "\", \"SHAPE-ZIP\", \"" + thisJson.info.tipo + "\")'>SHP</li>" + "<li data-type='application%2Fvnd.google-earth.kml%2Bxml' onclick='downloadArquivo(\"" + thisJson.info.infoLayer + "\", \"application%2Fvnd.google-earth.kml%2Bxml\",  \"" + thisJson.info.tipo + "\")'>KML</li>" + "<li data-type='application%2Fjson' onclick='downloadArquivo(\"" + thisJson.info.infoLayer + "\", \"application%2Fjson\",  \"" + thisJson.info.tipo + "\")'>GeoJson</li>" + "<li data-type='application%2Fx-gpkg' onclick='downloadArquivo(\"" + thisJson.info.infoLayer + "\", \"application%2Fx-gpkg\",  \"" + thisJson.info.tipo + "\")'>GPKG</li>" + "</ul>" + "</div>" + "</td></tr></table></div>";
                        }
                        //16-02-2016
                    }
                } else {
                    htmlDinamicoSubItens = htmlDinamicoSubItens + " indiceRotulo = ''";
                    htmlDinamicoSubItens = htmlDinamicoSubItens + " zoomRotulo = '#'";
                    htmlDinamicoSubItens = htmlDinamicoSubItens + ">" + "<img src='../js/img/switcher-none.png' id='img_" + thisJson.layerID + "' class='divRotulo' status='none' permitido = 'false' onclick='chaveiaRotulos(" + thisJson.layerID + ");'><img src='" + thisJson.legenda + "' tematico='" + thisJson.tematico + "'srcTematico='" + thisJson.tematicoLegenda + "' onclick='javascript: if (this.getAttribute(\"tematico\") == \"true\"){chamaLegenda(\"" + thisJson.tematicoLegenda + "\")}' class='divLegenda' alt='legenda'><label class='lblLayerSwitcherItem' title='" + thisJson.tooltip + "'>" + "&nbsp;<img src='../css/img/icones/download_icone.png' class='divLegenda' title='Clique para fazer o download da camada' " + (thisJson.Download.habilitaDownload === "false" || thisJson.Download.habilitaDownload === "" ? "style='display:none;'" : "") + " onclick='" + (thisJson.Download.habilitaDownload === "trueGEOSERVER" ? "alternaDropdown(event," + thisJson.layerID + ");" : (thisJson.Download.habilitaDownload === "trueNAS" ? "_downloadArquivos(); globalctlBtnDownloadArquivos.panel_div.className = \"ctlBtnDownloadArquivosItemActive olButton\";" : "")) + "'>" + (thisJson.Metadado.habilitaMetadado === "true" ? "<img src='../css/img/icones/metadados_icone.png' class='divLegenda' title='Clique para visualizar os metadados' " + "onclick='chamarMetadados(\"" + thisJson.Metadado.idMetadado + "\");'>" : "") + thisJson.layerLabel + "</label><div id='dropdown_" + thisJson.layerID + "' class='dropdown-menu' style='display: none;'>" + "<ul>" + "<li data-type='SHAPE-ZIP' onclick='downloadArquivo(\"" + thisJson.info.infoLayer + "\", \"SHAPE-ZIP\", \"" + thisJson.info.tipo + "\")'>SHP</li>" + "<li data-type='application%2Fvnd.google-earth.kml%2Bxml' onclick='downloadArquivo(\"" + thisJson.info.infoLayer + "\", \"application%2Fvnd.google-earth.kml%2Bxml\",  \"" + thisJson.info.tipo + "\")'>KML</li>" + "<li data-type='application%2Fjson' onclick='downloadArquivo(\"" + thisJson.info.infoLayer + "\", \"application%2Fjson\",  \"" + thisJson.info.tipo + "\")'>GeoJson</li>" + "<li data-type='application%2Fx-gpkg' onclick='downloadArquivo(\"" + thisJson.info.infoLayer + "\", \"application%2Fx-gpkg\",  \"" + thisJson.info.tipo + "\")'>GPKG</li>" + "</ul>" + "</div>" + "</td></tr></table></div>";
                }

                //FIM Rótulos
                //************************************************************************

                //htmlDinamicoSubGrupo = htmlDinamicoSubItens + htmlDinamicoSubGrupo;   //10102014
                htmlDinamicoSubGrupo = htmlDinamicoSubGrupo + htmlDinamicoSubItens;
                htmlDinamicoSubItens = "";

            } //fim ativo
        } else if (tipo == "subgrupo") {

            var labelAgrupador = "";

            //Monta o checkbox na DIV para cara registro
            indexSubGrupo = indexSubGrupo + 1;

            //controla visibilidade dos checkbox de acordo com o zoom
            var arrayZoomExib = thisJson.aparencia.zoomExib.split("#");
            //cria um tooltip mostrando em que níveis de zoom será mostrado
            var tooltip = 'Zoom de vizualização: ' + (thisJson.aparencia.zoomExib).replace('#', ',');

            //if ($.inArray(zoomAtual.toString(), arrayZoomExib) != -1 && this.ocultavel == 'false') {
            if (thisJson.ocultavel == 'false') {
                htmlSubDinamico = htmlSubDinamico + "<div style='display:block;' id='div_" + thisJson.layerID + "'><table><tr><td class='tdLayers'>&nbsp;&nbsp;";
                htmlSubDinamico = htmlSubDinamico + "<a href=\'javascript: treeControl(" + "\"" + thisJson.layerID + "\"" + ")\'>";
                htmlSubDinamico = htmlSubDinamico + "<img src='../js/img/plusbottom.gif' border='0' id='btnMaisMenos_" + thisJson.layerID + "'>";
                htmlSubDinamico = htmlSubDinamico + "</a>";
                htmlSubDinamico = htmlSubDinamico + "<input style='visibility: hidden; width: 1px;height: 1px;' id='" + thisJson.layerID + "' name='chkLayers' type='checkbox' indice='S' indicegrupo='" + (indexGrupo) + "' indicesubgrupo='" + (indexSubGrupo) + "' agrupador='true' tipoControle='SG' onchange='chkChange(this)' ";
            } else {
                htmlSubDinamico = htmlSubDinamico + "<div style='display:none;' id='div_" + thisJson.layerID + "'><table><tr><td class='tdLayers'>&nbsp;&nbsp;";
                htmlSubDinamico = htmlSubDinamico + "<a href=\'javascript: treeControl(" + "\"" + thisJson.layerID + "\"" + ")\'>";
                htmlSubDinamico = htmlSubDinamico + "<img src='../js/img/plusbottom.gif' border='0' id='btnMaisMenos_" + thisJson.layerID + "'>";
                htmlSubDinamico = htmlSubDinamico + "</a>";
                htmlSubDinamico = htmlSubDinamico + "<input style='visibility: hidden; width: 1px;height: 1px;' id='" + thisJson.layerID + "' name='chkLayers' type='checkbox' indice='S' indicegrupo='" + (indexGrupo) + "' indicesubgrupo='" + (indexSubGrupo) + "' agrupador='true' tipoControle='SG' onchange='chkChange(this)' ";
            }


            //cria atributo de ocultável ou não
            htmlSubDinamico = htmlSubDinamico + "ocultavel= '" + thisJson.ocultavel + "' ";


            //Se for readOnly desabilita o chkbox e cria atributo somenteleitura
            if (thisJson.aparencia.readOnly == 'true') {
                htmlSubDinamico = htmlSubDinamico + " disabled = 'true' somenteleitura='true' ";
            } else {
                htmlSubDinamico = htmlSubDinamico + " somenteleitura='false' ";
            }

            if (thisJson.aparencia.visible == 'true') {
                htmlSubDinamico = htmlSubDinamico + "checked><label class='lblLayerSwitcherItem' title='" + thisJson.tooltip + "'>" + thisJson.layerLabel + "</label></td></tr></table></div>";
                //Cria array com camadas que devem ser exibidas de acordo com o arquivo de configuração
                ////layersVisiveis.push(indexArrayLayers);
            } else {
                htmlSubDinamico = htmlSubDinamico + "><label class='lblLayerSwitcherItem' title='" + thisJson.tooltip + "'>" + thisJson.layerLabel + "</label></td></tr></table></div>";
                //Cria array com camadas que não devem ser exibidas de acordo com o arquivo de configuração
                ////layersInvisiveis.push(indexArrayLayers);
            }


            labelAgrupador = thisJson.layerLabel;


        } //fim if tipo
    } //fim function montaHtml


} //end function carregaLayerSwicher



//***************************************************************************************************************************************************
//***************************************************************************************************************************************************
//Nome: ControlaCamadas()
//Objetivo: Controla as camadas pelo Layer Switch
//Disparador(es): chkChange() (função do checkBox do Layer Switch)
//***************************************************************************************************************************************************
//***************************************************************************************************************************************************
function ControlaCamadas(camada, visibilidade, idarray, indiceGrupoPai, indiceSubGrupoPai, agrupador, tipoControle) {
    var indiceRotulo;
    //var zoomAtual = map.getZoom();
    var zoomAtual = Math.round(map.getZoom()) //Necessário para funcionar o fractionalZoom = true
    //var tipoControle = 'MB';  //para testes

    //Se o controle for do tipo MapaBase, deve desabilitar todos os outros controles do mesmo tipo MB pois somente um é permitido por vez
    if (tipoControle == 'MB') {

        if (map.getLayersBy('layerIndiceReal', idarray)[0] == undefined) {

            for (var k = 0; k < layers.length; k++) {
                if (layers[k].layerIndiceReal == idarray) {
                    map.addLayers([layers[k]]);

                    layersCargaInicialMapa.push(idarray);
                }
            }

            map.getLayersBy('layerIndiceReal', idarray)[0].setVisibility(visibilidade);

        }

        //adicionei o evento abaixo para solucionar o bug de zoom nos mapas base                                  
        map.setBaseLayer(map.getLayersBy('layerIndiceReal', idarray)[0]);

        map.getLayersBy('layerIndiceReal', idarray)[0].setVisibility(visibilidade);

        var chkMB = document.getElementsByName("chkLayers")
        var id;
        for (var i = 0; i < chkMB.length; i++) {
            if (chkMB.item(i).getAttribute('tipoControle') == 'MB' & camada !== chkMB[i].id) {



                if (map.getLayersBy('layerIndiceReal', chkMB.item(i).getAttribute('indice'))[0] != undefined) {

                    map.getLayersBy('layerIndiceReal', chkMB.item(i).getAttribute('indice'))[0].setVisibility(false);
                }




                //map.layers[chkMB.item(i).getAttribute('indice')].setVisibility(false);
                chkMB[i].checked = false;
            }
        }
    } else {

        if (agrupador == 'true') {
            //busca todos os chkbox que tem o indiceGrupo = indiceGrupoPai
            var arrayChk = document.getElementsByName("chkLayers");
            var indiceGrupo;
            var indiceFilho;
            var indicePai;
            var statuChecadoFilho;
            var somenteleitura;
            var contemZoomAtual = false;

            for (var i = 0; i < arrayChk.length; i++) {
                //pega atributos do controle
                //se for subgrupo ou grupo
                if (indiceSubGrupoPai !== '') {
                    indiceGrupo = eval(arrayChk)[i].getAttribute('indicesubgrupo');
                    indicePai = indiceSubGrupoPai;
                } else {
                    indiceGrupo = eval(arrayChk)[i].getAttribute('indicegrupo');
                    indicePai = indiceGrupoPai;
                }

                indiceFilho = eval(arrayChk)[i].getAttribute('indice');
                statuChecadoFilho = eval(arrayChk)[i].checked;
                somenteleitura = eval(arrayChk)[i].getAttribute('somenteleitura');

                //se pertence ao grupo que está sendo desabilitado
                if (indiceGrupo == indicePai) {

                    //Se nao for o proprio agrupador
                    //if (eval(arrayChk)[i].getAttribute('agrupador') == "false") {
                    if (idarray !== indiceFilho) {
                        //seta visibilidade da camada filho somente se o chkbox dele estiver checado, se deve ser exibido nesse nível de zoom ou se for um sub

                        if (eval(arrayChk)[i].getAttribute('agrupador') == "false") {
                            contemZoomAtual = ($.inArray(zoomAtual.toString(), eval(arrayChk)[i].getAttribute('zoomExib').split("#")) != -1);
                        } else {
                            //se for um subgrupo chama a funcao e sai do loop
                            ControlaCamadas(eval(arrayChk)[i].id, visibilidade, eval(arrayChk)[i].getAttribute('indice'), eval(arrayChk)[i].getAttribute('indicegrupo'), eval(arrayChk)[i].getAttribute('indicesubgrupo'), eval(arrayChk)[i].getAttribute('agrupador'), eval(arrayChk)[i].getAttribute('tipoControle'));
                            contemZoomAtual = false;
                        }


                        //if (statuChecadoFilho == true) {



                        if (map.getLayersBy('layerIndiceReal', indiceFilho)[0] == undefined) {

                            for (var k = 0; k < layers.length; k++) {
                                if (layers[k].layerIndiceReal == indiceFilho) {
                                    map.addLayers([layers[k]]);

                                    layersCargaInicialMapa.push(indiceFilho);
                                }
                            }

                        }


                        if (contemZoomAtual) {



                            //map.layers[indiceFilho].setVisibility(visibilidade);
                            map.getLayersBy('layerIndiceReal', indiceFilho)[0].setVisibility(visibilidade);
                            //marca ou desmarca o controle
                            eval(arrayChk)[i].checked = visibilidade;

                            //se tiver rotulos associados, também seta a visibilidade deles
                            indiceRotulo = eval(arrayChk)[i].getAttribute('indiceRotulo');
                            //indicesRotulos = eval(arrayChk)[i].getAttribute('indicesrotulos');
                            //arrayIndicesRotulos = indicesRotulos.split("#");

                            if (indiceRotulo != '') {
                                if (visibilidade == true) {
                                    //se o rotulo estiver marcado e for permitido nesse nivel de zoom, deve mudar a visibilidade da camada
                                    var subcamada = eval(arrayChk)[i].getAttribute('id');
                                    //if (document.getElementById("img_" + camada).getAttribute('status') == 'on' && document.getElementById("img_" + camada).getAttribute('permitido') == 'true') {
                                    if (document.getElementById("img_" + subcamada).getAttribute('status') == 'on' && document.getElementById("img_" + subcamada).getAttribute('permitido') == 'true') {
                                        //map.layers[parseInt(indiceRotulo)].setVisibility(true);


                                        if (map.getLayersBy('layerIndiceReal', parseInt(indiceRotulo))[0] == undefined) {

                                            for (var k = 0; k < layers.length; k++) {
                                                if (layers[k].layerIndiceReal == parseInt(indiceRotulo)) {
                                                    map.addLayers([layers[k]]);

                                                    layersCargaInicialMapa.push(parseInt(indiceRotulo));
                                                }
                                            }

                                        }

                                        map.getLayersBy('layerIndiceReal', parseInt(indiceRotulo))[0].setVisibility(true);

                                        //quando ativa o rótulo, desativa a camada do mapa
                                        //map.layers[parseInt(idarray)].setVisibility(false);
                                        map.getLayersBy('layerIndiceReal', parseInt(indiceFilho))[0].setVisibility(false);
                                    }
                                } else {


                                    if (map.getLayersBy('layerIndiceReal', parseInt(indiceRotulo))[0] == undefined) {

                                        for (var k = 0; k < layers.length; k++) {
                                            if (layers[k].layerIndiceReal == parseInt(indiceRotulo)) {
                                                map.addLayers([layers[k]]);

                                                layersCargaInicialMapa.push(parseInt(indiceRotulo));
                                            }
                                        }

                                    }

                                    //map.layers[parseInt(indiceRotulo)].setVisibility(false);
                                    map.getLayersBy('layerIndiceReal', parseInt(indiceRotulo))[0].setVisibility(false);
                                }
                            }
                        } else {
                            //marca ou desmarca o controle mesmo que não seja visualizado nesse nível de zoom
                            eval(arrayChk)[i].checked = visibilidade;


                            map.getLayersBy('layerIndiceReal', indiceFilho)[0].setVisibility(false);

                            //se tiver rotulos associados, também seta a visibilidade deles
                            indiceRotulo = eval(arrayChk)[i].getAttribute('indiceRotulo');
                            //indicesRotulos = eval(arrayChk)[i].getAttribute('indicesrotulos');
                            //arrayIndicesRotulos = indicesRotulos.split("#");

                            if (indiceRotulo != '') {

                                //se o rotulo estiver marcado e for permitido nesse nivel de zoom, deve mudar a visibilidade da camada
                                //var subcamada = eval(arrayChk)[i].getAttribute('id');
                                //if (document.getElementById("img_" + camada).getAttribute('status') == 'on' && document.getElementById("img_" + camada).getAttribute('permitido') == 'true') {
                                //if (document.getElementById("img_" + subcamada).getAttribute('status') == 'on' && document.getElementById("img_" + subcamada).getAttribute('permitido') == 'true') {
                                //map.layers[parseInt(indiceRotulo)].setVisibility(true);


                                if (map.getLayersBy('layerIndiceReal', parseInt(indiceRotulo))[0] == undefined) {

                                    for (var k = 0; k < layers.length; k++) {
                                        if (layers[k].layerIndiceReal == parseInt(indiceRotulo)) {
                                            map.addLayers([layers[k]]);

                                            layersCargaInicialMapa.push(parseInt(indiceRotulo));
                                        }
                                    }

                                }


                                map.getLayersBy('layerIndiceReal', indiceRotulo)[0].setVisibility(false);



                                // }

                            }




                        }
                    }
                }
            } //end for


            //só faz as verificações abaixo se for um ítem dentro de grupo
            /*if (indiceSubGrupoPai !== '') {

            }*/
            //***************************************************************************************************************************************************************************
            //varre todos os outros ítens do grupo (caso pertença à um grupo). Se todos estiverem marcados, marca o pai do grupo, se todos estiverem desmarcados, desmarca o pai do grupo
            //***************************************************************************************************************************************************************************
            var arrayChk = document.getElementsByName("chkLayers");
            var indiceGrupo;
            var indiceSubGrupo;
            var indiceItem;
            var contadorMarcados = 0;
            var contadorDesmarcados = 0;
            var contadorTotal = 0;
            var statuChecadoItem;

            for (var i = 0; i < arrayChk.length; i++) {
                //pega atributos do controle
                indiceItem = eval(arrayChk)[i].getAttribute('indice');
                StatusAgrupador = eval(arrayChk)[i].getAttribute('agrupador');
                statuChecadoItem = eval(arrayChk)[i].checked;
                indiceGrupo = eval(arrayChk)[i].getAttribute('indicegrupo');
                indicePai = indiceGrupoPai;

                //Se pertence ao mesmo grupo
                if (indiceGrupo == indicePai) {
                    //se for agrupador (mas somente se é o grupo que o ítem pertence e não subgrupos que estejam abaixo desse grupo)
                    if (StatusAgrupador == "true" && indiceGrupoPai == eval(arrayChk)[i].getAttribute('indicegrupo') && eval(arrayChk)[i].getAttribute('indicesubgrupo') == '') {
                        //guarda o índice do pai para poder marcar ou desmarcar
                        IndicePai = i;
                    } else {
                        if (statuChecadoItem == true) {
                            contadorMarcados = contadorMarcados + 1;
                            contadorTotal = contadorTotal + 1;
                        } else {
                            contadorDesmarcados = contadorDesmarcados + 1;
                            contadorTotal = contadorTotal + 1;
                        }
                    }
                }
            } //end for

            if (contadorMarcados == contadorTotal) {
                eval(arrayChk)[IndicePai].checked = true;
            } else {
                eval(arrayChk)[IndicePai].checked = false;
            }
            //***************************************************************************************************************************************************************************
            //***************************************************************************************************************************************************************************
            //***************************************************************************************************************************************************************************

        } else {

            var arrayChk = document.getElementsByName("chkLayers");


            if (map.getLayersBy('layerIndiceReal', idarray)[0] == undefined) {

                for (var i = 0; i < layers.length; i++) {
                    if (layers[i].layerIndiceReal == idarray) {
                        map.addLayers([layers[i]]);

                        layersCargaInicialMapa.push(idarray);
                    }
                }

            }


            map.getLayersBy('layerIndiceReal', idarray)[0].setVisibility(visibilidade);
            // map.layers[idarray].setVisibility(visibilidade);

            //se tiver rotulos associados, também seta a visibilidade deles
            indiceRotulo = document.getElementById(camada).getAttribute('indiceRotulo');
            //indicesRotulos = document.getElementById(camada).getAttribute('indicesrotulos');
            //arrayIndicesRotulos = indicesRotulos.split("#");

            if (indiceRotulo != '') {

                if (visibilidade == true) {
                    //se o rotulo estiver marcado e for permitido nesse nivel de zoom, deve mudar a visibilidade da camada
                    if (document.getElementById("img_" + camada).getAttribute('status') == 'on' && document.getElementById("img_" + camada).getAttribute('permitido') == 'true') {


                        if (map.getLayersBy('layerIndiceReal', parseInt(indiceRotulo))[0] == undefined) {

                            for (var i = 0; i < layers.length; i++) {
                                if (layers[i].layerIndiceReal == parseInt(indiceRotulo)) {
                                    map.addLayers([layers[i]]);

                                    layersCargaInicialMapa.push(parseInt(indiceRotulo));
                                }
                            }

                        }

                        map.getLayersBy('layerIndiceReal', parseInt(indiceRotulo))[0].setVisibility(true);
                        //map.layers[parseInt(indiceRotulo)].setVisibility(true);

                        //quando ativa o rótulo, desativa a camada do mapa
                        map.getLayersBy('layerIndiceReal', parseInt(idarray))[0].setVisibility(false);
                        //map.layers[parseInt(idarray)].setVisibility(false);
                    }
                } else {


                    if (map.getLayersBy('layerIndiceReal', parseInt(indiceRotulo))[0] == undefined) {

                        for (var i = 0; i < layers.length; i++) {
                            if (layers[i].layerIndiceReal == parseInt(indiceRotulo)) {
                                map.addLayers([layers[i]]);

                                layersCargaInicialMapa.push(parseInt(indiceRotulo));
                            }
                        }

                    }

                    map.getLayersBy('layerIndiceReal', parseInt(indiceRotulo))[0].setVisibility(false);
                    //map.layers[parseInt(indiceRotulo)].setVisibility(false);
                }
            }

            //***************************************************************************************************************************************************************************
            //varre todos os outros ítens do grupo (caso pertença à um grupo). Se todos estiverem marcados, marca o pai do grupo, se todos estiverem desmarcados, desmarca o pai do grupo
            //***************************************************************************************************************************************************************************
            var arrayChk = document.getElementsByName("chkLayers");
            var indiceGrupo;
            var indiceSubGrupo;
            var indiceItem;
            var contadorMarcados = 0;
            var contadorDesmarcados = 0;
            var contadorTotal = 0;
            var statuChecadoItem;

            for (var i = 0; i < arrayChk.length; i++) {
                //pega atributos do controle
                indiceItem = eval(arrayChk)[i].getAttribute('indice');
                StatusAgrupador = eval(arrayChk)[i].getAttribute('agrupador');
                statuChecadoItem = eval(arrayChk)[i].checked;

                //pega atributos do controle
                //se for subgrupo ou grupo
                if (indiceSubGrupoPai !== '') {
                    indiceGrupo = eval(arrayChk)[i].getAttribute('indicesubgrupo');
                    indicePai = indiceSubGrupoPai;
                } else {
                    indiceGrupo = eval(arrayChk)[i].getAttribute('indicegrupo');
                    indicePai = indiceGrupoPai;
                }

                //Se pertence ao mesmo grupo
                if (indiceGrupo == indicePai) {
                    //se for agrupador (mas somente se é o grupo que o ítem pertence e não subgrupos que estejam abaixo desse grupo)
                    if (StatusAgrupador == "true" && indiceSubGrupoPai == eval(arrayChk)[i].getAttribute('indicesubgrupo')) {
                        //guarda o índice do pai para poder marcar ou desmarcar
                        IndicePai = i;
                    } else {
                        if (statuChecadoItem == true) {
                            contadorMarcados = contadorMarcados + 1;
                            contadorTotal = contadorTotal + 1;
                        } else {
                            contadorDesmarcados = contadorDesmarcados + 1;
                            contadorTotal = contadorTotal + 1;
                        }
                    }
                }
            } //end for

            if (contadorMarcados == contadorTotal) {
                eval(arrayChk)[IndicePai].checked = true;
            } else {
                eval(arrayChk)[IndicePai].checked = false;
            }
            //***************************************************************************************************************************************************************************
            //***************************************************************************************************************************************************************************
            //***************************************************************************************************************************************************************************

            //***************************************************************************************************************************************************************************
            //se o item agrupador checado for um subgrupo, faz a mesma verificação*********************************************************************************************************
            //***************************************************************************************************************************************************************************

            if (eval(arrayChk)[IndicePai].getAttribute('indicesubgrupo') !== "") {
                //***************************************************************************************************************************************************************************
                //varre todos os outros ítens do grupo. Se todos estiverem marcados, marca o pai do grupo, se todos estiverem desmarcados, desmarca o pai do grupo
                //***************************************************************************************************************************************************************************
                var indiceAvo;

                contadorMarcados = 0;
                contadorDesmarcados = 0;
                contadorTotal = 0;

                for (var i = 0; i < arrayChk.length; i++) {
                    //pega atributos do controle
                    indiceItem = eval(arrayChk)[i].getAttribute('indice');
                    StatusAgrupador = eval(arrayChk)[i].getAttribute('agrupador');
                    statuChecadoItem = eval(arrayChk)[i].checked;
                    indiceGrupo = eval(arrayChk)[i].getAttribute('indicegrupo');
                    //indicePai = indiceGrupoPai;


                    //Se pertence ao mesmo grupo
                    if (indiceGrupo == indiceGrupoPai) {
                        //se for agrupador (mas somente se é o grupo que o ítem pertence e não subgrupos que estejam abaixo desse grupo)
                        if (StatusAgrupador == "false" && eval(arrayChk)[i].getAttribute('indicesubgrupo') == '') {
                            if (statuChecadoItem == true) {
                                contadorMarcados = contadorMarcados + 1;
                                contadorTotal = contadorTotal + 1;
                            } else {
                                contadorDesmarcados = contadorDesmarcados + 1;
                                contadorTotal = contadorTotal + 1;
                            }
                        } else if (StatusAgrupador == "true" && eval(arrayChk)[i].getAttribute('indicesubgrupo') !== '') {
                            if (statuChecadoItem == true) {
                                contadorMarcados = contadorMarcados + 1;
                                contadorTotal = contadorTotal + 1;
                            } else {
                                contadorDesmarcados = contadorDesmarcados + 1;
                                contadorTotal = contadorTotal + 1;
                            }
                        } else if (StatusAgrupador == "true" && indiceGrupoPai == indiceGrupo) {
                            indiceAvo = i;

                        }
                    }
                } //end for

                if (contadorMarcados == contadorTotal) {
                    eval(arrayChk)[indiceAvo].checked = true;
                } else {
                    eval(arrayChk)[indiceAvo].checked = false;
                }
                //***************************************************************************************************************************************************************************
                //***************************************************************************************************************************************************************************
                //***************************************************************************************************************************************************************************
            }

            //***************************************************************************************************************************************************************************
            //***************************************************************************************************************************************************************************
            //***************************************************************************************************************************************************************************



        } //endif agrupador

    } //fim tipo MB

    controlaNiveisSelecao(zoomAtual);
    controlaNiveisInformacao(zoomAtual);



} //function





//***************************************************************************************************************************************************
//***************************************************************************************************************************************************
//Nome: zoomChangeLayerSwitcher()
//Objetivo: Controla as camadas de acordo com o zoom que foi alterado
//Disparador(es): zoomChanged
//***************************************************************************************************************************************************
//***************************************************************************************************************************************************
function zoomChangeLayerSwitcher(zoom) {
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
                                if (this.agrupador == 'false') {
                                    if (chkBoxSub.checked == true /*&& chkBox.checked == true*/) {

                                        for (var j = 0; j < layersCargaInicialMapa.length; j++) {
                                            if (chkBoxSub.getAttribute('indice') == layersCargaInicialMapa[j]) {
                                                map.getLayersBy('layerIndiceReal', chkBoxSub.getAttribute('indice'))[0].setVisibility(true);
                                                visibilidade = true;
                                                //habilitar chk
                                                //chkBoxSub.disabled = false;
                                            }
                                        }
                                    } else {


                                        //for (var j = 0; j < layersCargaInicialMapa.length; j++) {
                                        //if (chkBoxSub.getAttribute('indice') == layersCargaInicialMapa[j]) {
                                        if (map.getLayersBy('layerIndiceReal', chkBoxSub.getAttribute('indice'))[0] != undefined) {
                                            map.getLayersBy('layerIndiceReal', chkBoxSub.getAttribute('indice'))[0].setVisibility(false);
                                        }
                                        visibilidade = false;
                                        //}
                                        //}
                                    }
                                }


                            } else {
                                ////divChkBoxSub.style.display = "none";
                                HabDesItemLS(divChkBoxSub, 'off');

                                //se o checkBox tem índice <> 'G' (Ítem agrupador)
                                if (this.agrupador == 'false') {


                                    for (var j = 0; j < layersCargaInicialMapa.length; j++) {
                                        if (chkBoxSub.getAttribute('indice') == layersCargaInicialMapa[j]) {
                                            map.getLayersBy('layerIndiceReal', chkBoxSub.getAttribute('indice'))[0].setVisibility(false);
                                            visibilidade = false;
                                        }
                                    }
                                }

                            }

                            /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                            /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                            /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                            /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                            /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                            /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                            //Se tiver subcamadas2, varre todas deste agrupador setando a visibilidade
                            jQuery.each(this.subcamadas, function (json6) {

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
                                        if (this.agrupador == 'false') {
                                            if (chkBoxSub.checked == true /*&& chkBox.checked == true*/) {

                                                for (var j = 0; j < layersCargaInicialMapa.length; j++) {
                                                    if (chkBoxSub.getAttribute('indice') == layersCargaInicialMapa[j]) {
                                                        map.getLayersBy('layerIndiceReal', chkBoxSub.getAttribute('indice'))[0].setVisibility(true);
                                                        visibilidade = true;
                                                    }
                                                }
                                            } else {

                                                //for (var j = 0; j < layersCargaInicialMapa.length; j++) {
                                                //if (chkBoxSub.getAttribute('indice') == layersCargaInicialMapa[j]) {
                                                if (map.getLayersBy('layerIndiceReal', chkBoxSub.getAttribute('indice'))[0] != undefined) {
                                                    map.getLayersBy('layerIndiceReal', chkBoxSub.getAttribute('indice'))[0].setVisibility(false);
                                                }
                                                visibilidade = false;
                                                //}
                                                //}
                                            }
                                        }


                                    } else {
                                        ////divChkBoxSub.style.display = "none";
                                        HabDesItemLS(divChkBoxSub, 'off');

                                        //se o checkBox tem índice <> 'G' (Ítem agrupador)
                                        if (this.agrupador == 'false') {




                                            for (var j = 0; j < layersCargaInicialMapa.length; j++) {
                                                if (chkBoxSub.getAttribute('indice') == layersCargaInicialMapa[j]) {
                                                    map.getLayersBy('layerIndiceReal', chkBoxSub.getAttribute('indice'))[0].setVisibility(false);
                                                    visibilidade = false;
                                                }
                                            }
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
                                                    //ajuste de bug de acionamento de rotulo que ocorria em camadas com controle de rótulo onde especificamente a mesma era ligada antes do rotulo estar na escala permitida de visualiação.
                                                    imagemRotulo.src = "../js/img/switcher-on.png";
                                                    ControlaCamadas(chkBoxSub.id, true, chkBoxSub.getAttribute('indice'), chkBoxSub.getAttribute('indicegrupo'), chkBoxSub.getAttribute('indicesubgrupo'), chkBoxSub.getAttribute('agrupador'), chkBoxSub.getAttribute('tipoControle'));
                                                    //fim ajuste bug
                                                    if (indiceRotulo != '') {


                                                        for (var j = 0; j < layersCargaInicialMapa.length; j++) {
                                                            if (parseInt(indiceRotulo) == layersCargaInicialMapa[j]) {
                                                                map.getLayersBy('layerIndiceReal', parseInt(indiceRotulo))[0].setVisibility(true);

                                                                //05/05/2014 - Agora desabilita a camada caso o rótulo seja ativado
                                                                map.getLayersBy('layerIndiceReal', chkBoxSub.getAttribute('indice'))[0].setVisibility(false);

                                                                imagemRotulo.src = "../js/img/switcher-on.png";
                                                            }
                                                        }


                                                    }
                                                } else {
                                                    imagemRotulo.src = "../js/img/switcher-off.png";
                                                }
                                            } else {



                                                for (var j = 0; j < layersCargaInicialMapa.length; j++) {
                                                    if (parseInt(indiceRotulo) == layersCargaInicialMapa[j]) {
                                                        map.getLayersBy('layerIndiceReal', parseInt(indiceRotulo))[0].setVisibility(false);
                                                        //muda imagem para sem rótulo
                                                        imagemRotulo.src = "../js/img/switcher-none.png";
                                                    }
                                                }


                                            }
                                        } else {




                                            for (var j = 0; j < layersCargaInicialMapa.length; j++) {
                                                if (parseInt(indiceRotulo) == layersCargaInicialMapa[j]) {
                                                    map.getLayersBy('layerIndiceReal', parseInt(indiceRotulo))[0].setVisibility(false);

                                                }
                                            }



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
                            /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                            /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                            /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                            /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                            /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                            /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


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
                                            //ajuste de bug de acionamento de rotulo que ocorria em camadas com controle de rótulo onde especificamente a mesma era ligada antes do rotulo estar na escala permitida de visualiação.
                                            imagemRotulo.src = "../js/img/switcher-on.png";
                                            ControlaCamadas(chkBoxSub.id, true, chkBoxSub.getAttribute('indice'), chkBoxSub.getAttribute('indicegrupo'), chkBoxSub.getAttribute('indicesubgrupo'), chkBoxSub.getAttribute('agrupador'), chkBoxSub.getAttribute('tipoControle'));
                                            //fim ajuste bug
                                            if (indiceRotulo != '') {


                                                if (map.getLayersBy('layerIndiceReal', parseInt(indiceRotulo))[0] == undefined) {

                                                    for (var k = 0; k < layers.length; k++) {
                                                        if (layers[k].layerIndiceReal == parseInt(indiceRotulo)) {
                                                            map.addLayers([layers[k]]);
                                                            //alterei aqui em 05/04/2017
                                                            layersCargaInicialMapa.push(parseInt(indiceRotulo));
                                                        }
                                                    }

                                                }


                                                for (var j = 0; j < layersCargaInicialMapa.length; j++) {
                                                    if (parseInt(indiceRotulo) == layersCargaInicialMapa[j]) {
                                                        map.getLayersBy('layerIndiceReal', parseInt(indiceRotulo))[0].setVisibility(true);


                                                        map.getLayersBy('layerIndiceReal', chkBoxSub.getAttribute('indice'))[0].setVisibility(false);

                                                        imagemRotulo.src = "../js/img/switcher-on.png";
                                                    }
                                                }
                                            }
                                        } else {
                                            imagemRotulo.src = "../js/img/switcher-off.png";
                                        }
                                    } else {

                                        for (var j = 0; j < layersCargaInicialMapa.length; j++) {
                                            if (parseInt(indiceRotulo) == layersCargaInicialMapa[j]) {
                                                map.getLayersBy('layerIndiceReal', parseInt(indiceRotulo))[0].setVisibility(false);


                                                //muda imagem para sem rótulo
                                                imagemRotulo.src = "../js/img/switcher-none.png";
                                            }
                                        }
                                    }
                                } else {

                                    for (var j = 0; j < layersCargaInicialMapa.length; j++) {
                                        if (parseInt(indiceRotulo) == layersCargaInicialMapa[j]) {
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
                                        }
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
//Nome: mostraCamadaLS()
//Objetivo: Indica para o usuário onde está a camada no LS
//Disparador(es): init();
//***************************************************************************************************************************************************
//***************************************************************************************************************************************************

function mostraCamadaLS(camada) {

    // obtém o elemento da camada
    var elementoCamada = document.getElementById(camada.text.value);
    //verifica se a camada está contida em grupo e expande o mesmo.
    var indiceGrupo = elementoCamada.getAttribute("indicegrupo");
    if (indiceGrupo) {
        var grupo = LayersBusca.layersMapa[indiceGrupo - 1];
        var divElementoGrupo = document.getElementById("divGp_" + grupo.layerID);
        if (divElementoGrupo) {
            if (divElementoGrupo.style.display == 'none') {
                treeControl(grupo.layerID);
            }
            //verifica se a camada está contida em subgrupo e expande o mesmo.
            var indiceSubgrupo = elementoCamada.getAttribute("indicesubgrupo");
            if (indiceSubgrupo) {
                var elementoSubGrupo = divElementoGrupo.querySelector(`input[indicesubgrupo="${indiceSubgrupo}"]`);
                var divElementoSubGrupo = document.getElementById("divGp_" + elementoSubGrupo.id);
                if (divElementoSubGrupo) {
                    if (divElementoSubGrupo.style.display == 'none') {
                        treeControl(elementoSubGrupo.id);
                    }
                }
            }
        }
    }

    // adiciona um pequeno atraso para garantir que a expansão ocorra antes da rolagem
    setTimeout(() => {
        elementoCamada.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
    }, 300); // Tempo ajustável para melhor funcionamento

    function piscarCheckbox(checkbox) {
        var corOriginal = checkbox.style.outline || "none"; // Salva a cor original
        var vezes = 6; // Número de piscadas

        function alterarCor(cor) {
            checkbox.style.outline = `3px solid ${cor}`;
        }

        var contador = 0;
        var intervalo = setInterval(() => {
            alterarCor(contador % 2 === 0 ? "red" : "transparent");
            contador++;
            if (contador >= vezes * 2) {
                clearInterval(intervalo);
                alterarCor(corOriginal); // Restaura a cor original
            }
        }, 300); // Tempo de cada piscada
    }

    // Se o checkbox estiver invisível (visibility:hidden), pisque o ícone "btnMaisMenos_<id>"
    var invisivel = window.getComputedStyle(elementoCamada).visibility === 'hidden';
    var alvoPiscada = elementoCamada; // padrão: o próprio checkbox

    if (invisivel) {
        var idIcone = "btnMaisMenos_" + camada.text.value;
        var icone = document.getElementById(idIcone);
        if (icone) {
            alvoPiscada = icone; // aplica piscada no ícone
        }
        // se não encontrar o ícone, mantém o alvo como o checkbox
    }

    piscarCheckbox(alvoPiscada);
}





///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



//    function ControlaCamadasNovo(camada, visibilidade, idarray, indiceGrupoPai, indiceSubGrupoPai, agrupador, tipoControle) {
//        var indiceRotulo;
//        //var zoomAtual = map.getZoom();
//        //var zoomAtual = Math.round(map.getZoom()) //Necessário para funcionar o fractionalZoom = true
//        //arredonda para baixo - 24/02/2015
//        var zoomAtual = Math.floor(map.getZoom()) //Necessário para funcionar o fractionalZoom = true
//        //var tipoControle = 'MB';  //para testes


//        //tipos de controle
//        //MB - Mapa Base
//        //G - Grupo
//        //SG = SubGrupo
//        //I - Ítem (ítem na raiz)
//        //SI - Sub Ítem (ítem dentro de grupo)
//        //SI2 - Sub Ítem 2 (ítem dentro de subgrupo)

//        //verifica o tipo de Controle e chama a funcao correspondente
//        if (tipoControle == 'MB') {
//            ControlaCamadasMB(camada, visibilidade, idarray, indiceGrupoPai, indiceSubGrupoPai, agrupador, tipoControle);
//        } else if (tipoControle == 'G') {
//            ControlaCamadasG(camada, visibilidade, idarray, indiceGrupoPai, indiceSubGrupoPai, agrupador, tipoControle);
//        } else if (tipoControle == 'SG') {
//            ControlaCamadasSG(camada, visibilidade, idarray, indiceGrupoPai, indiceSubGrupoPai, agrupador, tipoControle);        
//        } else if (tipoControle == 'I') {
//            ControlaCamadasI(camada, visibilidade, idarray, indiceGrupoPai, indiceSubGrupoPai, agrupador, tipoControle);
//        } else if (tipoControle == 'SI') {
//            ControlaCamadasSI(camada, visibilidade, idarray, indiceGrupoPai, indiceSubGrupoPai, agrupador, tipoControle);
//        } else if (tipoControle == 'SI2') {
//            ControlaCamadasSI2(camada, visibilidade, idarray, indiceGrupoPai, indiceSubGrupoPai, agrupador, tipoControle);
//        }


//        
//                    


//                for (var i = 0; i < length; i++) {
//                    //varre todos os outros ítens do grupo (caso pertença à um grupo). Se todos estiverem marcados, marca o pai do grupo, se todos estiverem desmarcados, desmarca o pai do grupo
//                    var arrayChk = document.getElementsByName("chkLayers");
//                    var indiceGrupo;
//                    var indiceSubGrupo;
//                    var indiceItem;
//                    var contadorMarcados = 0;
//                    var contadorDesmarcados = 0;
//                    var contadorTotal = 0;
//                    var statuChecadoItem;

//                    for (var i = 0; i < arrayChk.length; i++) {
//                        //pega atributos do controle
//                        //indiceGrupo = eval(arrayChk)[i].getAttribute('indicegrupo');
//                        //indiceSubGrupo = eval(arrayChk)[i].getAttribute('indicesubgrupo');
//                        indiceItem = eval(arrayChk)[i].getAttribute('indice');
//                        StatusAgrupador = eval(arrayChk)[i].getAttribute('agrupador');
//                        statuChecadoItem = eval(arrayChk)[i].checked;

//                        //pega atributos do controle
//                        //se for subgrupo ou grupo
//                        if (indiceSubGrupoPai !== '') {
//                            indiceGrupo = eval(arrayChk)[i].getAttribute('indicesubgrupo');
//                            indicePai = indiceSubGrupoPai;
//                        } else {
//                            indiceGrupo = eval(arrayChk)[i].getAttribute('indicegrupo');
//                            indicePai = indiceGrupoPai;
//                        }

//                        //Se pertence ao mesmo grupo
//                        if (indiceGrupo == indicePai) {

//                            //se for agrupador (mas somente se é o grupo que o ítem pertence e não subgrupos que estejam abaixo desse grupo)
//                            if (StatusAgrupador == "true" && indiceSubGrupoPai == eval(arrayChk)[i].getAttribute('indicesubgrupo')) {
//                                //guarda o índice do pai para poder marcar ou desmarcar
//                                IndicePai = i;
//                            } else {
//                                if (statuChecadoItem == true) {
//                                    contadorMarcados = contadorMarcados + 1;
//                                    contadorTotal = contadorTotal + 1;
//                                } else {
//                                    contadorDesmarcados = contadorDesmarcados + 1;
//                                    contadorTotal = contadorTotal + 1;
//                                }
//                            }
//                        }
//                    } //end 
//                }


//                if (contadorMarcados == contadorTotal) {
//                    eval(arrayChk)[IndicePai].checked = true;
//                    //////////////////////////////////////////////////////////
//                    //se for um subgrupo chama a funcao e sai do loop
//                    //ControlaCamadas(eval(arrayChk)[IndicePai].id, visibilidade, eval(arrayChk)[IndicePai].getAttribute('indice'), eval(arrayChk)[IndicePai].getAttribute('indicegrupo'), eval(arrayChk)[IndicePai].getAttribute('indicesubgrupo'), eval(arrayChk)[IndicePai].getAttribute('agrupador'), eval(arrayChk)[IndicePai].getAttribute('tipoControle'));
//                    //contemZoomAtual = false;


//                } else {
//                    eval(arrayChk)[IndicePai].checked = false;
//                }


//    } //function



//##############################################################################################################################################################################################################
//##############################################################################################################################################################################################################
//##############################################################################################################################################################################################################
//##############################################################################################################################################################################################################
//##############################################################################################################################################################################################################
//##############################################################################################################################################################################################################
//##############################################################################################################################################################################################################
//##############################################################################################################################################################################################################
//##############################################################################################################################################################################################################
//##############################################################################################################################################################################################################


//    function ControlaCamadasMB(camada, visibilidade, idarray, indiceGrupoPai, indiceSubGrupoPai, agrupador, tipoControle){
//            //Se o controle for do tipo MapaBase, deve desabilitar todos os outros controles do mesmo tipo MB pois somente um é permitido por vez
//            map.getLayersBy('layerIndiceReal', idarray)[0].setVisibility(visibilidade);

//            var chkMB = document.getElementsByName("chkLayers")
//            var id;
//            for (var i = 0; i < chkMB.length; i++) {
//                if (chkMB.item(i).getAttribute('tipoControle') == 'MB' & camada !== chkMB[i].id) {
//                    map.getLayersBy('layerIndiceReal', chkMB.item(i).getAttribute('indice'))[0].setVisibility(false);
//                    //map.layers[chkMB.item(i).getAttribute('indice')].setVisibility(false);
//                    chkMB[i].checked = false;
//                }
//            }
//    } //fim ControlaCamadasMB

//    function ControlaCamadasG(camada, visibilidade, idarray, indiceGrupoPai, indiceSubGrupoPai, agrupador, tipoControle){
//            //busca todos os chkbox que tem o indiceGrupo = indiceGrupoPai
//                var arrayChk = document.getElementsByName("chkLayers");
//                var indiceGrupo;
//                var indiceFilho;
//                var indicePai;
//                var statuChecadoFilho;
//                var somenteleitura;
//                var contemZoomAtual = false;

//                for (var i = 0; i < arrayChk.length; i++) {
//                    //pega atributos do controle
//                    //se for subgrupo ou grupo
//                    indiceGrupo = eval(arrayChk)[i].getAttribute('indicegrupo');
//                    indicePai = indiceGrupoPai;

//                    indiceFilho = eval(arrayChk)[i].getAttribute('indice');
//                    statuChecadoFilho = eval(arrayChk)[i].checked;
//                    somenteleitura = eval(arrayChk)[i].getAttribute('somenteleitura');

//                    //se pertence ao grupo que está sendo desabilitado
//                    if (indiceGrupo == indicePai) {

//                        //Se nao for o proprio agrupador
//                        //if (eval(arrayChk)[i].getAttribute('agrupador') == "false") {
//                        if (idarray !== indiceFilho) {
//                            //seta visibilidade da camada filho somente se o chkbox dele estiver checado, se deve ser exibido nesse nível de zoom ou se for um sub
//                            if (eval(arrayChk)[i].getAttribute('agrupador') == "false") {
//                                contemZoomAtual = ($.inArray(zoomAtual.toString(), eval(arrayChk)[i].getAttribute('zoomExib').split("#")) != -1);
//                            } else {
//                                //se for um subgrupo chama a funcao e sai do loop
//                                ControlaCamadasSG(eval(arrayChk)[i].id, visibilidade, eval(arrayChk)[i].getAttribute('indice'), eval(arrayChk)[i].getAttribute('indicegrupo'), eval(arrayChk)[i].getAttribute('indicesubgrupo'), eval(arrayChk)[i].getAttribute('agrupador'), eval(arrayChk)[i].getAttribute('tipoControle'));
//                                contemZoomAtual = false;
//                            }

//                            //if (statuChecadoFilho == true) {
//                            if (contemZoomAtual) {
//                                //map.layers[indiceFilho].setVisibility(visibilidade);
//                                map.getLayersBy('layerIndiceReal', indiceFilho)[0].setVisibility(visibilidade);
//                                //marca ou desmarca o controle
//                                eval(arrayChk)[i].checked = visibilidade;

//                                //se tiver rotulos associados, também seta a visibilidade deles
//                                indiceRotulo = eval(arrayChk)[i].getAttribute('indiceRotulo');
//                                //indicesRotulos = eval(arrayChk)[i].getAttribute('indicesrotulos');
//                                //arrayIndicesRotulos = indicesRotulos.split("#");

//                                if (indiceRotulo != '') {
//                                    if (visibilidade == true) {
//                                        //se o rotulo estiver marcado e for permitido nesse nivel de zoom, deve mudar a visibilidade da camada
//                                        var subcamada = eval(arrayChk)[i].getAttribute('id');
//                                        //if (document.getElementById("img_" + camada).getAttribute('status') == 'on' && document.getElementById("img_" + camada).getAttribute('permitido') == 'true') {
//                                        if (document.getElementById("img_" + subcamada).getAttribute('status') == 'on' && document.getElementById("img_" + subcamada).getAttribute('permitido') == 'true') {
//                                            //map.layers[parseInt(indiceRotulo)].setVisibility(true);
//                                            map.getLayersBy('layerIndiceReal', parseInt(indiceRotulo))[0].setVisibility(true);

//                                            //quando ativa o rótulo, desativa a camada do mapa
//                                            //map.layers[parseInt(idarray)].setVisibility(false);
//                                            map.getLayersBy('layerIndiceReal', parseInt(indiceFilho))[0].setVisibility(false);
//                                        }
//                                    } else {
//                                        //map.layers[parseInt(indiceRotulo)].setVisibility(false);
//                                        map.getLayersBy('layerIndiceReal', parseInt(indiceRotulo))[0].setVisibility(false);
//                                    }
//                                }
//                            } else {
//                                //marca ou desmarca o controle mesmo que não seja visualizado nesse nível de zoom
//                                eval(arrayChk)[i].checked = visibilidade;
//                            }
//                        }
//                    }
//                } //end for
//    } //fim ControlaCamadasG

//    function ControlaCamadasSG(camada, visibilidade, idarray, indiceGrupoPai, indiceSubGrupoPai, agrupador, tipoControle){
//            //busca todos os chkbox que tem o indiceGrupo = indiceGrupoPai
//                var arrayChk = document.getElementsByName("chkLayers");
//                var indiceSubGrupo;
//                var indiceFilho;
//                var indicePai;
//                var statuChecadoFilho;
//                var somenteleitura;
//                var contemZoomAtual = false;

//                for (var i = 0; i < arrayChk.length; i++) {
//                    //pega atributos do controle
//                    //se for subgrupo ou grupo
//                    indiceSubGrupo = eval(arrayChk)[i].getAttribute('indicesubgrupo');
//                    indicePai = indiceGrupoPai;

//                    indiceFilho = eval(arrayChk)[i].getAttribute('indice');
//                    statuChecadoFilho = eval(arrayChk)[i].checked;
//                    somenteleitura = eval(arrayChk)[i].getAttribute('somenteleitura');

//                    //se pertence ao grupo que está sendo desabilitado
//                    if (indiceSubGrupo == indicePai) {

//                        //Se nao for o proprio agrupador
//                        //if (eval(arrayChk)[i].getAttribute('agrupador') == "false") {
//                        if (idarray !== indiceFilho) {
//                            //seta visibilidade da camada filho somente se o chkbox dele estiver checado, se deve ser exibido nesse nível de zoom
//                            contemZoomAtual = ($.inArray(zoomAtual.toString(), eval(arrayChk)[i].getAttribute('zoomExib').split("#")) != -1);

//                            //if (statuChecadoFilho == true) {
//                            if (contemZoomAtual) {
//                                //map.layers[indiceFilho].setVisibility(visibilidade);
//                                map.getLayersBy('layerIndiceReal', indiceFilho)[0].setVisibility(visibilidade);
//                                //marca ou desmarca o controle
//                                eval(arrayChk)[i].checked = visibilidade;

//                                //se tiver rotulos associados, também seta a visibilidade deles
//                                indiceRotulo = eval(arrayChk)[i].getAttribute('indiceRotulo');
//                                //indicesRotulos = eval(arrayChk)[i].getAttribute('indicesrotulos');
//                                //arrayIndicesRotulos = indicesRotulos.split("#");

//                                if (indiceRotulo != '') {
//                                    if (visibilidade == true) {
//                                        //se o rotulo estiver marcado e for permitido nesse nivel de zoom, deve mudar a visibilidade da camada
//                                        var subcamada = eval(arrayChk)[i].getAttribute('id');
//                                        //if (document.getElementById("img_" + camada).getAttribute('status') == 'on' && document.getElementById("img_" + camada).getAttribute('permitido') == 'true') {
//                                        if (document.getElementById("img_" + subcamada).getAttribute('status') == 'on' && document.getElementById("img_" + subcamada).getAttribute('permitido') == 'true') {
//                                            //map.layers[parseInt(indiceRotulo)].setVisibility(true);
//                                            map.getLayersBy('layerIndiceReal', parseInt(indiceRotulo))[0].setVisibility(true);

//                                            //quando ativa o rótulo, desativa a camada do mapa
//                                            //map.layers[parseInt(idarray)].setVisibility(false);
//                                            map.getLayersBy('layerIndiceReal', parseInt(indiceFilho))[0].setVisibility(false);
//                                        }
//                                    } else {
//                                        //map.layers[parseInt(indiceRotulo)].setVisibility(false);
//                                        map.getLayersBy('layerIndiceReal', parseInt(indiceRotulo))[0].setVisibility(false);
//                                    }
//                                }
//                            } else {
//                                //marca ou desmarca o controle mesmo que não seja visualizado nesse nível de zoom
//                                eval(arrayChk)[i].checked = visibilidade;
//                            }
//                        }
//                    }
//                } //end for
//    } //fim ControlaCamadasSG



//    function ControlaCamadasI(camada, visibilidade, idarray, indiceGrupoPai, indiceSubGrupoPai, agrupador, tipoControle){
//                map.getLayersBy('layerIndiceReal', idarray)[0].setVisibility(visibilidade);

//                //se tiver rotulos associados, também seta a visibilidade deles
//                indiceRotulo = document.getElementById(camada).getAttribute('indiceRotulo');
//                //indicesRotulos = document.getElementById(camada).getAttribute('indicesrotulos');
//                //arrayIndicesRotulos = indicesRotulos.split("#");

//                if (indiceRotulo != '') {
//                    if (visibilidade == true) {
//                        //se o rotulo estiver marcado e for permitido nesse nivel de zoom, deve mudar a visibilidade da camada
//                        if (document.getElementById("img_" + camada).getAttribute('status') == 'on' && document.getElementById("img_" + camada).getAttribute('permitido') == 'true') {
//                            map.getLayersBy('layerIndiceReal', parseInt(indiceRotulo))[0].setVisibility(true);
//                            //map.layers[parseInt(indiceRotulo)].setVisibility(true);

//                            //quando ativa o rótulo, desativa a camada do mapa
//                            map.getLayersBy('layerIndiceReal', parseInt(idarray))[0].setVisibility(false);
//                            //map.layers[parseInt(idarray)].setVisibility(false);
//                        }
//                    } else {
//                        map.getLayersBy('layerIndiceReal', parseInt(indiceRotulo))[0].setVisibility(false);
//                        //map.layers[parseInt(indiceRotulo)].setVisibility(false);
//                    }
//                }
//    } //fim ControlaCamadasSG
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////