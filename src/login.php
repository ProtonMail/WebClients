<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <base href="/">
  <title>ProtonMail</title>
  <link rel="shortcut icon" href="/assets/favicon.ico" />
  <link rel="stylesheet" type="text/css" href="/assets/app.css" />
</head>
<body class="login">

<div id="body">
  <nav class="navbar navbar-default navbar-static-top navbar-inverse navbar-inversed hidden-xs" role="navigation">
    <div class="container-fluid">
      <div class="navbar-header">
        <button type="button" class="navbar-toggle" data-toggle="collapse" data-target="#navbar-collapse-large">
          <span class="sr-only">Toggle navigation</span>
          <span class="icon-bar"></span>
          <span class="icon-bar"></span>
          <span class="icon-bar"></span>
        </button>
        <a href="/" class="navbar-brand">
          <img src="/assets/img/protonmail_logo_beta.png" alt="ProtonMail">
        </a>
      </div>
      <div class="collapse navbar-collapse" id="navbar-collapse-large">
        <div class="spinner hide" id="loginSpinner">
          <div class="bounce1"></div>
          <div class="bounce2"></div>
          <div class="bounce3"></div>
        </div>
        <ul class="nav navbar-nav navbar-right">
          <li id="nav_login">
            <a href="/login"><span class="visible-lg-inline-block fa fa-power-off"></span> Sign In</a>
          </li>
        </ul>
      </div>
    </div>
  </nav>

  <div class="container-fluid">
    <div class="row">
      <div class="col-lg-4 col-lg-offset-4 col-md-4 col-md-offset-4 col-sm-4 col-sm-offset-4">
        <div class="panel panel-default wrap">
          <div class="panel-body panel-thick">
            <form onsubmit="return validate()" id="sign_in_form" name="sign_in" method="post" class="pure-form pure-form-stacked" role="form" autocomplete="off">
              <h1 class="text-center">
                <span class="fa fa-2x fa-power-off faded"></span>Sign In
              </h1>
              <p class="alert alert-warning text-center hide" role="alert" id="igg-contributor">
                <strong>
                  <a href="">Indiegogo Contributor?</a>
                </strong>
              </p>
              <div class="form-group" id="signInFirst">
                <input autocomplete="off" type="text" class="form-control" tabindex="1" name="Username" placeholder="Username" required autofocus="" value="">
              </div><!--/.form-group-->
              <div class="form-group" id="signInSecond">
                <input autocomplete="off" type="password" class="form-control" tabindex="2" name="Password" required placeholder="Password" value="">
              </div><!--/.form-group-->
              <a href="/support/reset-password" class="pull-left btn btn-link">Need Help?</a>
              <button type="submit" class="pull-right btn btn-primary" id="login_btn" tabindex="4">
                <span class="fa fa-power-off"></span>
                <span>Sign In</span>
              </button>
              <input type="hidden" id="hashed_pw" name="hashed_pw">
            </form>
          </div><!--/.panel-body-->
        </div>
      </div><!--/.col-md-4-->
    </div><!--/.row-->
  </div><!--/.container-->

  <footer id="footer">
    <div class="container-fluid">
      <span class="pull-right hidden-xs">
        <a href="/blog/">Blog</a>
        <a href="/pages/faq">FAQ</a>
        <a href="/pages/security-details">Security Details</a>
        <a href="/pages/privacy-policy">Privacy Policy</a>
        <a href="/pages/terms-and-conditions">Terms &amp; Conditions</a>
        <a href="//twitter.com/ProtonMail" target="_blank"><i class="fa fa-twitter-square"></i></a>
        <a href="//www.facebook.com/protonmail" target="_blank"><i class="fa fa-facebook-square"></i></a>
      </span>
      <span class="copy">&copy; 2014 ProtonMail.ch
        <span class="hidden-xs"> - Made globally, hosted in Switzerland.</span>
      </span>
      <div class="clear"></div>
    </div><!--/.container-->
  </footer>

</div>

<script type="text/javascript">
function login() {
  document.getElementById("loginSpinner").className = "spinner";
  document.getElementById("login_btn").setAttribute('disabled', 'true');
  return true;
}
function validate() {
  var username = document.forms["sign_in"]["Username"];
  var password = document.forms["sign_in"]["Password"];
  if (username.value == null || username.value == "") {
    alert("Username required.");
    username.focus();
    return false;
  }
  else if (password.value == null || password.value == "") {
    alert("Username required.");
    password.focus();
    return false;
  }
  else {
    return login();
  }
}
</script>
</body>
</html>
