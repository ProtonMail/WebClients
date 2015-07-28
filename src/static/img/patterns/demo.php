<?php

$files = glob('*.{png,jpg,jpeg}', GLOB_BRACE);

?><!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Subtle Pattern Demo</title>
<style>
body , html { padding:0;margin:0;height:100%; }
body { background:#ccc none repeat 0 0; }
form { padding:10px;text-align:center;background:#FFF;border-bottom:1px solid #000; }
</style>
</head>
<body>
<form>
<select id="image">
  <option><?php echo implode( "</option>\n  <option>" , $files ); ?></option>
</select>
</form>

<script src="http://code.jquery.com/jquery.min.js"></script>
<script>
$(document).ready(function(){

  $('#image')
    .bind('keyup change unfocus blur',function(){
      $('body').css( 'background-image' , 'url('+$(this).val()+')' );
    })
    .blur();

});
</script>
</body>
</html>