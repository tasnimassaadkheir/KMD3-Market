var GeoSampa = {
    GenericPanel: null,
    Eventos: new Event(),
    Druid: new Druid(),
    // ConsultaSimples: new ConsultaSimples(),
    Layers: null,
    Resultado: {},
    SelectedLayers: {},
    QueryBuilder: null,
    ConsultaAgrupada: null,
    Importar: null,
    FerramentaDeSelecaoDeDesenhoAtiva: null,
    Desenho: null,
    getLayerAttributes: function (Layer, callback) {
        var wfs_options = {
            service: "wfs",
            version: "1.0.0",
            typeName: Layer,
            request: "DescribeFeatureType",
            outputFormat: "application/json"
        };

        var _hc = jQuery('#hc', window.parent.document).val();

        $.ajax({
            url: 'map.geo?hc=' + _hc + '&tipoServico=DWFS1',
            data: wfs_options,
            dataType: 'json',
            success: function (json) {
                callback(json.featureTypes[0].properties)
            }
        });
    },
    util: function () {

        var _ids = "";

        this.setIds = function (ids) {
            _ids = ids;
        }

        this.disableAllExcept = function (id) {

            var _itens = $(_ids);

            for (var _index = 0; _index < _itens.length; _index++) {
                if (id.indexOf('#' + _itens[_index].id) < 0) {
                    $(_itens[_index]).attr("disabled", true);
                } else {
                    $(_itens[_index]).attr("disabled", false);
                }
            }

        };
    },

    getLayer: function (Layers, Predicate) {
        var _my_vector = {};

        var _GetLayer = function (Layer, Parent) {

            if (typeof Layer["forEach"] !== "function") return;

            Layer.forEach(function (_item) {
                if (Parent === null) Parent = { Id: _item.layerID, Nome: _item.layerLabel, Camadas: [] };

                if (eval(_item.agrupador.toLowerCase())) {
                    _GetLayer(_item.subcamadas, { Id: _item.layerID, Nome: _item.layerLabel, Camadas: [] });
                }

                if (Predicate(_item)) {

                    if (_my_vector[Parent.Id] == null) {
                        _my_vector[Parent.Id] = Parent;
                    }

                    _my_vector[Parent.Id].Camadas.push({
                        Id: _item.selecao.camada,
                        Nome: _item.layerLabel,
                        Table: _item.NomeTabela,
                        GeometryField: _item.info.infoGeom,
                        AtributoConsultaSimples: _item.AtributoConsultaSimples,
                        AliasConsultaSimples: _item.ConsultaSimplesAlias
                    });

                }
            });
        };
        _GetLayer(Layers);
        return _my_vector;
    },
    renderDesenhoComboItem: function () {
        if (GeoSampa.Desenho !== null) {

            var _cboGrupo = '<option value="Desenho">Desenho</option>';


            var _cboCamada = '<option tipo="Desenho" value="LineString"> Desenho do Tipo Linha</option>' +
                '<option tipo="Desenho" value="Point"> Desenho do Tipo Ponto</option>' +
                '<option tipo="Desenho" value="Polygon"> Desenho do Tipo Poligono</option>';


            $('#cboCamadaSelecaoPai').html($('#cboCamadaSelecaoPai').html() + _cboGrupo);
            $('#cboCamadaSelecaoFilhoH').html($('#cboCamadaSelecaoFilhoH').html() + _cboCamada);

            //nao ha ferramenta de selecao no GEOSAMPA CIDADAO
            /*
            
            if (globalctlBtnSelecao.panel_div.className == "ctlBtnSelecaoItemInactiveTransparent olButton") {
                globalctlBtnSelecao.panel_div.className = "ctlBtnSelecaoItemInactive olButton";
                habilitaSelecao = true;
            }

            */

            return true;
        } else {
            return false;
        }

    },

    renderCamadaImportadaComboItem: function () {
        if (GeoSampa.Importar !== null) {

            var _cboGrupo = '<option value="CamadaImportada">Importação</option>';

            var _cboCamada = '<option tipo="CamadaImportada" value="CamadaImportada">Camada Importada</option>';

            $('#cboCamadaSelecaoPai').html($('#cboCamadaSelecaoPai').html() + _cboGrupo);
            $('#cboCamadaSelecaoFilhoH').html($('#cboCamadaSelecaoFilhoH').html() + _cboCamada);

            //if (globalctlBtnSelecao.panel_div.className == "ctlBtnSelecaoItemInactiveTransparent olButton") {
            //globalctlBtnSelecao.panel_div.className = "ctlBtnSelecaoItemInactive olButton";
            //habilitaSelecao = true;
            //}

            return true;
        } else {
            return false;
        }

    }




}