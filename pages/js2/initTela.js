
/*Criando método limitador de entrada em campo texto com contador de caracteres restantes*/
(function ($) {
    $.fn.extend({
        limiter: function (limit, elem) {
            $(this).on("keyup focus", function () {
                setCount(this, elem);
            });
            function setCount(src, elem) {
                var chars = src.value.length;
                if (chars > limit) {
                    src.value = src.value.substr(0, limit);
                    chars = limit;
                }
                elem.html(limit - chars);
            }
            setCount($(this)[0], elem);
        }
    });
})(jQuery);


/* Bloco para comandos de configuração inicial da tela*/
$(document).ready(function () {
    
    /* Para resolver problemas com IE8 em reconhecer tamanho da div usando '%' */
    if (jQuery.browser.msie) {
        $('#map').css('width', $(window).width());
        $('#map').css('height', $(window).height());
    }

});
  