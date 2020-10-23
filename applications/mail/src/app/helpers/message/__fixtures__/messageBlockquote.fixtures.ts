/* eslint-disable @typescript-eslint/naming-convention */

/**
 * Mails extracted by us
 */

const proton1 = `
    <div><br></div>
    <div><br></div>
    <div class="protonmail_signature_block">
        <div class="protonmail_signature_block-user protonmail_signature_block-empty"><br></div>
        <div class="protonmail_signature_block-proton">Sent with <a href="https://protonmail.com" target="_blank">ProtonMail</a> Secure Email.<br></div>
    </div>
    <div><br></div>
    <div class="protonmail_quote">
        <div>‐‐‐‐‐‐‐ Original Message ‐‐‐‐‐‐‐<br></div>
        <div> On Monday 19 January 1970 à 08:21, Matthieu Lux  wrote:<br></div>
        <div> <br></div>
        <blockquote class="protonmail_quote" type="cite"><div dir="ltr">1<br></div></blockquote>
    </div>
`;

const gmail1 = `
    <div>
        <div dir="ltr">3</div>
        <br>
        <div class="gmail_quote">
            <div class="gmail_attr" dir="ltr">Le&nbsp;ven. 14 févr. 2020 à&nbsp;10:19, swiip.test &lt;swiip.test@protonmail.blue&gt; a écrit&nbsp;:<br></div>
            <blockquote style="margin:0px 0px 0px 0.8ex;border-left:1px solid rgb(204,204,204);padding-left:1ex" class="gmail_quote">
                <div>
                    <div>2<br></div><div><br></div><div><div><br></div><div>Sent with <a target="_blank" href="https://protonmail.com" rel="noreferrer nofollow noopener">ProtonMail</a> Secure Email.<br></div></div><div><br></div><span>‐‐‐‐‐‐‐ Original Message ‐‐‐‐‐‐‐</span><br>
                    On Monday 19 January 1970 à 08:21, Matthieu Lux  wrote:<br>
                        <blockquote type="cite">
                            <div dir="ltr">1</div>
                        </blockquote>
                    <br>
                </div>
            </blockquote>
        </div>
    </div>
`;

/**
 * Mails found on https://github.com/mailgun/talon/tree/master/tests/fixtures
 */

const android = `
 <p>Hello</p>
<div class="gmail_quote">02.04.2012 14:20 пользователь &quot;<a href="mailto:bob@xxx.mailgun.org">bob@xxx.mailgun.org</a>&quot; &lt;<a href="mailto:bob@xxx.mailgun.org">bob@xxx.mailgun.org</a>&gt; написал:<br type="attribution">
<blockquote class="gmail_quote" style="margin:0 0 0 .8ex;border-left:1px #ccc solid;padding-left:1ex">Hi<br>
</blockquote></div>
 `;

const aol1 = `
 <font color='black' size='2' face='arial'>Hello<br>
 <span>toto</span>
 <span>-----Original Message-----</span>
 <br>
 <br>
 
 <div style="font-family:arial,helvetica;font-size:10pt;color:black">-----Original Message-----<br>
 From: bob &lt;bob@example.com&gt;<br>
 To: xxx &lt;xxx@gmail.com&gt;; xxx &lt;xxx@hotmail.com&gt;; xxx &lt;xxx@yahoo.com&gt;; xxx &lt;xxx@aol.com&gt;; xxx &lt;xxx@comcast.net&gt;; xxx &lt;xxx@nyc.rr.com&gt;<br>
 Sent: Mon, Apr 2, 2012 5:49 pm<br>
 Subject: Test<br>
 
 <br>
 
 
 <span>-----Original Message-----</span>
 
 
 
 
 <div id="AOLMsgPart_0_4d68a632-fe65-4f6d-ace2-292ac1b91f1f" style="margin: 0px;font-family: Tahoma, Verdana, Arial, Sans-Serif;font-size: 12px;color: #000;background-color: #fff;">
 
 <pre style="font-size: 9pt;"><tt>Hi
 </tt></pre>
 </div>
  <!-- end of AOLMsgPart_0_4d68a632-fe65-4f6d-ace2-292ac1b91f1f -->
 
 
 
 </div>
 </font>
 `;

const comcast = `
<html>
<head><style type='text/css'>p { margin: 0; }</style></head>
<body>
<div style='font-family: Arial; font-size: 12pt; color: #000000'>
Hello<br><br><hr id="zwchr"><b>From: </b>bob@xxx.mailgun.org<br><b>To: </b>xxx@gmail.com, xxx@hotmail.com, xxx@yahoo.com, xxx@aol.com, xxx@comcast.net, lsloan6@nyc.rr.com<br><b>Sent: </b>Monday, April 2, 2012 5:44:22 PM<br><b>Subject: </b>Test<br><br>Hi<br>
</div>
</body>
</html>
`;

const gmail2 = `
Hello<br><br><div class="gmail_quote">On Mon, Apr 2, 2012 at 6:26 PM, Megan One <span dir="ltr">&lt;<a href="mailto:xxx@gmail.com">xxx@gmail.com</a>&gt;</span> wrote:<br><blockquote class="gmail_quote" style="margin:0 0 0 .8ex;border-left:1px #ccc solid;padding-left:1ex">
Hi

</blockquote></div><br>
`;

const gmail3 = `
<div dir="ltr"><div class="gmail_default"><div class="gmail_default" style>Hi. I am fine.</div><div class="gmail_default" style><br></div><div class="gmail_default" style>Thanks,</div><div class="gmail_default" style>Alex</div>
</div></div><div class="gmail_extra"><br><br><div class="gmail_quote">On Thu, Jun 26, 2014 at 2:14 PM, Alexander L <span dir="ltr">&lt;<a href="mailto:abc@example.com" target="_blank">a@example.com</a>&gt;</span> wrote:<br>
<blockquote class="gmail_quote" style="margin:0 0 0 .8ex;border-left:1px #ccc solid;padding-left:1ex"><div dir="ltr"><div class="gmail_default" style="font-size:small"><div class="gmail_default" style="font-family:arial,sans-serif">
Hello! How are you?</div><div class="gmail_default" style="font-family:arial,sans-serif"><br>
</div><div class="gmail_default" style="font-family:arial,sans-serif">Thanks,</div><div class="gmail_default" style="font-family:arial,sans-serif">Sasha.</div></div></div>
</blockquote></div><br></div>
`;

const hotmail1 = `
<html>
<head>
<style><!--
.hmmessage P
{
margin:0px;
padding:0px
}
body.hmmessage
{
font-size: 10pt;
font-family:Tahoma
}
--></style></head>
<body class='hmmessage'><div dir='ltr'>
Hello<br><br><div><div id="SkyDrivePlaceholder"></div>&gt; Subject: Test<br>&gt; From: bob@xxx.mailgun.org<br>&gt; To: xxx@gmail.com; xxx@hotmail.com; xxx@yahoo.com; xxx@aol.com; xxx@comcast.net; xxx@nyc.rr.com<br>&gt; Date: Mon, 2 Apr 2012 17:44:22 +0400<br>&gt; <br>&gt; Hi<br></div> 		 	   		  </div></body>
</html>
`;

const hotmail2 = `
<?xml version="1.0" encoding="UTF-8"?>
<html>
<head>
<style><!--
.hmmessage P
{
margin:0px;
padding:0px
}
body.hmmessage
{
font-size: 12pt;
font-family:Calibri
}
--></style></head>
<body class='hmmessage'><div dir='ltr'>Hi. I am fine.<div><br></div><div>Thanks,</div><div>Alex<br><br><div><hr id="stopSpelling">Date: Thu, 26 Jun 2014 13:53:45 +0400<br>Subject: Test message<br>From: abc@example.com<br>To: alex.l@example.com<br><br><div dir="ltr"><div class="ecxgmail_default" style="font-size:small;">Hello! How are you?</div><div class="ecxgmail_default" style="font-size:small;"><br></div><div class="ecxgmail_default" style="font-size:small;">Thanks,</div><div class="ecxgmail_default" style="font-size:small;">
Sasha.</div></div></div></div> 		 	   		  </div></body>
</html>
`;

const outlook1 = `
<html xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns:m="http://schemas.microsoft.com/office/2004/12/omml" xmlns="http://www.w3.org/TR/REC-html40"><head><META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=us-ascii"><meta name=Generator content="Microsoft Word 14 (filtered medium)"><style><!--
/* Font Definitions */
@font-face
	{font-family:Calibri;
	panose-1:2 15 5 2 2 2 4 3 2 4;}
@font-face
	{font-family:Tahoma;
	panose-1:2 11 6 4 3 5 4 4 2 4;}
/* Style Definitions */
p.MsoNormal, li.MsoNormal, div.MsoNormal
	{margin:0cm;
	margin-bottom:.0001pt;
	font-size:12.0pt;
	font-family:"Times New Roman","serif";}
a:link, span.MsoHyperlink
	{mso-style-priority:99;
	color:blue;
	text-decoration:underline;}
a:visited, span.MsoHyperlinkFollowed
	{mso-style-priority:99;
	color:purple;
	text-decoration:underline;}
span.EmailStyle17
	{mso-style-type:personal-reply;
	font-family:"Calibri","sans-serif";
	color:#1F497D;}
.MsoChpDefault
	{mso-style-type:export-only;
	font-family:"Calibri","sans-serif";
	mso-fareast-language:EN-US;}
@page WordSection1
	{size:612.0pt 792.0pt;
	margin:72.0pt 72.0pt 72.0pt 72.0pt;}
div.WordSection1
	{page:WordSection1;}
--></style><!--[if gte mso 9]><xml>
<o:shapedefaults v:ext="edit" spidmax="1026" />
</xml><![endif]--><!--[if gte mso 9]><xml>
<o:shapelayout v:ext="edit">
<o:idmap v:ext="edit" data="1" />
</o:shapelayout></xml><![endif]--></head><body lang=EN-CA link=blue vlink=purple><div class=WordSection1><p class=MsoNormal><span style='font-size:11.0pt;font-family:"Calibri","sans-serif";color:#1F497D'>Allo! Follow up MIME!<o:p></o:p></span></p><p class=MsoNormal><span style='font-size:11.0pt;font-family:"Calibri","sans-serif";color:#1F497D'><o:p>&nbsp;</o:p></span></p><p class=MsoNormal><b><span lang=EN-US style='font-size:10.0pt;font-family:"Tahoma","sans-serif"'>From:</span></b><span lang=EN-US style='font-size:10.0pt;font-family:"Tahoma","sans-serif"'> xxx@xxx.mailgun.org [mailto:xxx@xxx.mailgun.org] <br><b>Sent:</b> March-09-12 4:22 PM<br><b>To:</b> Dan Le<br><b>Subject:</b> The manager has commented on your Loop<o:p></o:p></span></p><p class=MsoNormal><o:p>&nbsp;</o:p></p><p class=MsoNormal>Hi <a href="mailto:dan.le@example.com">dan.le@example.com</a>,<br><br>The manager's comment:<br>&quot;Hello Allan! Did you ask for some MIME? &quot;<br><br>Loop details:<br><br>xxx at Dan<br>I'm not happy<br>&quot;&quot;<br><br>Your Loop is <a href="http://dev.xxx.com/loop/view/4f50f20e160839c95a000bb3?_uid=4f3541a7ac63e655040008e3">here</a>.<br><br>We will be in touch again with any further updates,<br><br>xxx<br><br>If you did not sign up to receive emails from us you can use the link below to unsubscribe. We apologize for any inconvenience.<br><br><a href="http://dev.xxx.com/user/unsubscribe/dan.le@example.com?verify=4a400554148256338956101abdf06406">Unsubscribe</a> <o:p></o:p></p></div></body></html>
`;

const outlook2003 = `
<html xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">

<head>
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=us-ascii">
<meta name=Generator content="Microsoft Word 11 (filtered medium)">
<!--[if !mso]>
<style>
v\\:* {behavior:url(#default#VML);}
o\\:* {behavior:url(#default#VML);}
w\\:* {behavior:url(#default#VML);}
.shape {behavior:url(#default#VML);}
</style>
<![endif]-->
<style>
<!--
 /* Font Definitions */
 @font-face
	{font-family:Tahoma;
	panose-1:2 11 6 4 3 5 4 4 2 4;}
 /* Style Definitions */
 p.MsoNormal, li.MsoNormal, div.MsoNormal
	{margin:0cm;
	margin-bottom:.0001pt;
	font-size:12.0pt;
	font-family:"Times New Roman";}
a:link, span.MsoHyperlink
	{color:blue;
	text-decoration:underline;}
a:visited, span.MsoHyperlinkFollowed
	{color:purple;
	text-decoration:underline;}
span.EmailStyle17
	{mso-style-type:personal-reply;
	font-family:Arial;
	color:navy;}
@page Section1
	{size:595.3pt 841.9pt;
	margin:2.0cm 42.5pt 2.0cm 3.0cm;}
div.Section1
	{page:Section1;}
-->
</style>
<!--[if gte mso 9]><xml>
 <o:shapedefaults v:ext="edit" spidmax="1026" />
</xml><![endif]--><!--[if gte mso 9]><xml>
 <o:shapelayout v:ext="edit">
  <o:idmap v:ext="edit" data="1" />
 </o:shapelayout></xml><![endif]-->
</head>

<body lang=RU link=blue vlink=purple>

<div class=Section1>

<p class=MsoNormal><font size=2 color=navy face=Arial><span lang=EN-US
style='font-size:10.0pt;font-family:Arial;color:navy'>Hi. I am fine.<o:p></o:p></span></font></p>

<p class=MsoNormal><font size=2 color=navy face=Arial><span lang=EN-US
style='font-size:10.0pt;font-family:Arial;color:navy'><o:p>&nbsp;</o:p></span></font></p>

<p class=MsoNormal><font size=2 color=navy face=Arial><span lang=EN-US
style='font-size:10.0pt;font-family:Arial;color:navy'>Thanks,<o:p></o:p></span></font></p>

<p class=MsoNormal><font size=2 color=navy face=Arial><span lang=EN-US
style='font-size:10.0pt;font-family:Arial;color:navy'>Alex<o:p></o:p></span></font></p>

<p class=MsoNormal><font size=2 color=navy face=Arial><span style='font-size:
10.0pt;font-family:Arial;color:navy'><o:p>&nbsp;</o:p></span></font></p>

<div>

<div class=MsoNormal align=center style='text-align:center'><font size=3
face="Times New Roman"><span lang=EN-US style='font-size:12.0pt'>

<hr size=3 width="100%" align=center tabindex=-1>

</span></font></div>

<p class=MsoNormal><b><font size=2 face=Tahoma><span lang=EN-US
style='font-size:10.0pt;font-family:Tahoma;font-weight:bold'>From:</span></font></b><font
size=2 face=Tahoma><span lang=EN-US style='font-size:10.0pt;font-family:Tahoma'>
Alexander L [mailto:abc@example.com] <br>
<b><span style='font-weight:bold'>Sent:</span></b> Friday, June 27, 2014 12:06
PM<br>
<b><span style='font-weight:bold'>To:</span></b> Alexander<br>
<b><span style='font-weight:bold'>Subject:</span></b> Test message</span></font><span
lang=EN-US><o:p></o:p></span></p>

</div>

<p class=MsoNormal><font size=3 face="Times New Roman"><span style='font-size:
12.0pt'><o:p>&nbsp;</o:p></span></font></p>

<div>

<div>

<div>

<p class=MsoNormal><font size=3 face=Arial><span style='font-size:12.0pt;
font-family:Arial'>Hello! How are you?<o:p></o:p></span></font></p>

</div>

<div>

<p class=MsoNormal><font size=3 face=Arial><span style='font-size:12.0pt;
font-family:Arial'><o:p>&nbsp;</o:p></span></font></p>

</div>

<div>

<p class=MsoNormal><font size=3 face=Arial><span style='font-size:12.0pt;
font-family:Arial'>Thanks,<o:p></o:p></span></font></p>

</div>

<div>

<p class=MsoNormal><font size=3 face=Arial><span style='font-size:12.0pt;
font-family:Arial'>Sasha.<o:p></o:p></span></font></p>

</div>

</div>

</div>

</div>

</body>

</html>
`;

const outlook2007 = `
<html xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns:m="http://schemas.microsoft.com/office/2004/12/omml" xmlns="http://www.w3.org/TR/REC-html40"><head><meta http-equiv=Content-Type content="text/html; charset=utf-8"><meta name=Generator content="Microsoft Word 12 (filtered medium)"><style><!--
/* Font Definitions */
@font-face
	{font-family:"Cambria Math";
	panose-1:2 4 5 3 5 4 6 3 2 4;}
@font-face
	{font-family:Calibri;
	panose-1:2 15 5 2 2 2 4 3 2 4;}
@font-face
	{font-family:Tahoma;
	panose-1:2 11 6 4 3 5 4 4 2 4;}
/* Style Definitions */
p.MsoNormal, li.MsoNormal, div.MsoNormal
	{margin:0cm;
	margin-bottom:.0001pt;
	font-size:12.0pt;
	font-family:"Times New Roman","serif";}
a:link, span.MsoHyperlink
	{mso-style-priority:99;
	color:blue;
	text-decoration:underline;}
a:visited, span.MsoHyperlinkFollowed
	{mso-style-priority:99;
	color:purple;
	text-decoration:underline;}
span.EmailStyle17
	{mso-style-type:personal-reply;
	font-family:"Calibri","sans-serif";
	color:#1F497D;}
.MsoChpDefault
	{mso-style-type:export-only;}
@page WordSection1
	{size:612.0pt 792.0pt;
	margin:2.0cm 42.5pt 2.0cm 3.0cm;}
div.WordSection1
	{page:WordSection1;}
--></style><!--[if gte mso 9]><xml>
<o:shapedefaults v:ext="edit" spidmax="1026" />
</xml><![endif]--><!--[if gte mso 9]><xml>
<o:shapelayout v:ext="edit">
<o:idmap v:ext="edit" data="1" />
</o:shapelayout></xml><![endif]--></head>
<body lang=EN-US link=blue vlink=purple>
<div class=WordSection1>
<p class=MsoNormal><span style='font-size:11.0pt;font-family:"Calibri","sans-serif";color:#1F497D'>Hi. I am fine.<o:p></o:p></span></p>
<p class=MsoNormal><span style='font-size:11.0pt;font-family:"Calibri","sans-serif";color:#1F497D'> <o:p></o:p></span></p>
<p class=MsoNormal><span style='font-size:11.0pt;font-family:"Calibri","sans-serif";color:#1F497D'>Thanks,<o:p></o:p></span></p>
<p class=MsoNormal><span style='font-size:11.0pt;font-family:"Calibri","sans-serif";color:#1F497D'>Alex<o:p></o:p></span></p>
<p class=MsoNormal><span style='font-size:11.0pt;font-family:"Calibri","sans-serif";color:#1F497D'><o:p>&nbsp;</o:p></span></p>
<div style='border:none;border-top:solid #B5C4DF 1.0pt;padding:3.0pt 0cm 0cm 0cm'>
    <p class=MsoNormal><b><span lang=RU style='font-size:10.0pt;font-family:"Tahoma","sans-serif"'>From:</span></b><span lang=RU style='font-size:10.0pt;font-family:"Tahoma","sans-serif"'> Alexander L [mailto:abc@example.com] <br><b>Sent:</b> Thursday, July 03, 2014 3:50 PM<br><b>To:</b> alex.l@example.com<br><b>Subject:</b> Test message<o:p></o:p></span></p>
</div>
<p class=MsoNormal><o:p>&nbsp;</o:p></p>
<div><div><div><p class=MsoNormal><span style='font-family:"Arial","sans-serif"'>Hello! How are you?<o:p></o:p></span></p></div><div><p class=MsoNormal><span style='font-family:"Arial","sans-serif"'><o:p>&nbsp;</o:p></span></p></div><div><p class=MsoNormal><span style='font-family:"Arial","sans-serif"'>Thanks,<o:p></o:p></span></p></div><div><p class=MsoNormal><span style='font-family:"Arial","sans-serif"'>Sasha.<o:p></o:p></span></p></div></div></div></div></body></html>
`;

const outlook2010 = `
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=iso-2022-jp">
<meta name="Generator" content="Microsoft Word 14 (filtered medium)">
<style><!--
/* Font Definitions */
@font-face
	{font-family:Calibri;
	panose-1:2 15 5 2 2 2 4 3 2 4;}
@font-face
	{font-family:Tahoma;
	panose-1:2 11 6 4 3 5 4 4 2 4;}
/* Style Definitions */
p.MsoNormal, li.MsoNormal, div.MsoNormal
	{margin:0in;
	margin-bottom:.0001pt;
	font-size:12.0pt;
	font-family:"Times New Roman","serif";}
h3
	{mso-style-priority:9;
	mso-style-link:"Heading 3 Char";
	mso-margin-top-alt:auto;
	margin-right:0in;
	mso-margin-bottom-alt:auto;
	margin-left:0in;
	font-size:13.5pt;
	font-family:"Times New Roman","serif";
	font-weight:bold;}
a:link, span.MsoHyperlink
	{mso-style-priority:99;
	color:blue;
	text-decoration:underline;}
a:visited, span.MsoHyperlinkFollowed
	{mso-style-priority:99;
	color:purple;
	text-decoration:underline;}
p
	{mso-style-priority:99;
	mso-margin-top-alt:auto;
	margin-right:0in;
	mso-margin-bottom-alt:auto;
	margin-left:0in;
	font-size:12.0pt;
	font-family:"Times New Roman","serif";}
span.Heading3Char
	{mso-style-name:"Heading 3 Char";
	mso-style-priority:9;
	mso-style-link:"Heading 3";
	font-family:"Cambria","serif";
	color:#4F81BD;
	font-weight:bold;}
span.EmailStyle19
	{mso-style-type:personal-reply;
	font-family:"Calibri","sans-serif";
	color:#1F497D;}
.MsoChpDefault
	{mso-style-type:export-only;
	font-family:"Calibri","sans-serif";}
@page WordSection1
	{size:8.5in 11.0in;
	margin:1.0in 1.0in 1.0in 1.0in;}
div.WordSection1
	{page:WordSection1;}
--></style><!--[if gte mso 9]><xml>
<o:shapedefaults v:ext="edit" spidmax="1026" />
</xml><![endif]--><!--[if gte mso 9]><xml>
<o:shapelayout v:ext="edit">
<o:idmap v:ext="edit" data="1" />
</o:shapelayout></xml><![endif]-->
</head>
<body lang="EN-US" link="blue" vlink="purple">
<div class="WordSection1">
<p class="MsoNormal"><span style="font-size:11.0pt;font-family:&quot;Calibri&quot;,&quot;sans-serif&quot;;color:#1F497D">Hi. I am fine.<o:p></o:p></span></p>
<p class="MsoNormal"><span style="font-size:11.0pt;font-family:&quot;Calibri&quot;,&quot;sans-serif&quot;;color:#1F497D">Thanks,<o:p></o:p></span></p>
<p class="MsoNormal"><span style="font-size:11.0pt;font-family:&quot;Calibri&quot;,&quot;sans-serif&quot;;color:#1F497D">Alex<o:p></o:p></span></p>
<p class="MsoNormal"><b><span style="font-size:10.0pt;font-family:&quot;Tahoma&quot;,&quot;sans-serif&quot;">From:</span></b><span style="font-size:10.0pt;font-family:&quot;Tahoma&quot;,&quot;sans-serif&quot;"> Foo [mailto:foo@bar.com]
<b>On Behalf Of </b>baz@bar.com<br>
<b>Sent:</b> Monday, January 01, 2000 12:00 AM<br>
<b>To:</b> john@bar.com<br>
<b>Cc:</b> jane@bar.io<br>
<b>Subject:</b> Conversation<o:p></o:p></span></p>
<p class="MsoNormal"><o:p>&nbsp;</o:p></p>
<p>Hello! How are you?<o:p></o:p></p>
<p class="MsoNormal"><o:p>&nbsp;</o:p></p>
</div>
</body>
</html>
`;

const sparrow = `
<div>
<span style=3D=22font-size: 12px;=22>Hello</span>
</div>
<div><div><br></div><div>--&nbsp;</div><div>xx=
x</div><div>Sent with <a href=3D=22http://www.sparrowmailapp.com/=3Fsig=22=
>Sparrow</a></div><div><br></div></div>
=20
<p style=3D=22color: =23A0A0A8;=22>On Tuesday, April 3, 2=
012 at 4:55 PM, xxx wrote:</p>
<blockquote type=3D=22cite=22 style=3D=22border-left-styl=
e:solid;border-width:1px;margin-left:0px;padding-left:10px;=22>
<span><div><div><div>Hello</div><div><br></div><div>O=
n Apr 3, 2012, at 4:19 PM, bob wrote:</div><div><br></div><blo=
ckquote type=3D=22cite=22><div>Hi</div></blockquote></div></div></span>
=20
=20
=20
=20
</blockquote>
=20
<div>
<br>
</div>
`;

export const mail_ru = `
<HTML><BODY><p>Hi. I am fine.</p><p>Thanks,<br>Alex</p><br><br><br>Thu, 26 Jun 2014 14:00:51 +0400 от Alexander L &lt;abc@example.com&gt;:<br>
<blockquote style="border-left:1px solid #0857A6; margin:10px; padding:0 0 0 10px;">
	<div id="">
<div class="js-helper js-readmsg-msg">
	<style type="text/css"></style>
 	<div>
		<base target="_self" href="https://e.mail.ru/">
		
			<div id="style_14037768550000001020_BODY"><div dir="ltr"><div style="font-size:small"><div style="font-family:arial,sans-serif">Hello! How are you?</div><div style="font-family:arial,sans-serif"><br>
</div><div style="font-family:arial,sans-serif">Thanks,</div><div style="font-family:arial,sans-serif">Sasha.</div></div></div>
</div>
		<base target="_self" href="https://e.mail.ru/">
	</div>
</div>
</div>
</blockquote>
<br></BODY></HTML>
`;

const thunderbird = `
<html>
  <head>
    <meta content="text/html; charset=UTF-8" http-equiv="Content-Type">
  </head>
  <body bgcolor="#FFFFFF" text="#000000">
    Hi. I am fine.<br>
    <br>
    Thanks,<br>
    Alex<br>
    <div class="moz-cite-prefix">On 26.06.2014 14:41, Alexander L
      wrote:<br>
    </div>
    <blockquote
cite="mid:CA+jEWTKBU6qc4OnH5m=-0sfwkAzZhcy0rd+ean2W6bFUVXaO7A@mail.gmail.com"
      type="cite">
      <div dir="ltr">
        <div class="gmail_default" style="font-size:small">
          <div class="gmail_default"
            style="font-family:arial,sans-serif">Hello! How are you?</div>
          <div class="gmail_default"
            style="font-family:arial,sans-serif"><br>
          </div>
          <div class="gmail_default"
            style="font-family:arial,sans-serif">Thanks,</div>
          <div class="gmail_default"
            style="font-family:arial,sans-serif">Sasha.</div>
        </div>
      </div>
    </blockquote>
    <br>
  </body>
</html>
`;

const windows_mail = `
<html>
<head>
<meta name="generator" content="Windows Mail 17.5.9600.20498">
<style data-externalstyle="true"><!--
p.MsoListParagraph, li.MsoListParagraph, div.MsoListParagraph {
margin-top:0in;
margin-right:0in;
margin-bottom:0in;
margin-left:.5in;
margin-bottom:.0001pt;
}
p.MsoNormal, li.MsoNormal, div.MsoNormal {
margin:0in;
margin-bottom:.0001pt;
}
p.MsoListParagraphCxSpFirst, li.MsoListParagraphCxSpFirst, div.MsoListParagraphCxSpFirst, 
p.MsoListParagraphCxSpMiddle, li.MsoListParagraphCxSpMiddle, div.MsoListParagraphCxSpMiddle, 
p.MsoListParagraphCxSpLast, li.MsoListParagraphCxSpLast, div.MsoListParagraphCxSpLast {
margin-top:0in;
margin-right:0in;
margin-bottom:0in;
margin-left:.5in;
margin-bottom:.0001pt;
line-height:115%;
}
--></style></head>
<body dir="ltr">
<div data-externalstyle="false" dir="ltr" style="font-family: 'Calibri', 'Segoe UI', 'Meiryo', 'Microsoft YaHei UI', 'Microsoft JhengHei UI', 'Malgun Gothic', 'sans-serif';font-size:12pt;"><div>Hi. I am fine.</div><div><br></div><div>Thanks,</div><div>Alex<br></div><div data-signatureblock="true"><div><br></div><div><br></div></div><div style="padding-top: 5px; border-top-color: rgb(229, 229, 229); border-top-width: 1px; border-top-style: solid;"><div><font face=" 'Calibri', 'Segoe UI', 'Meiryo', 'Microsoft YaHei UI', 'Microsoft JhengHei UI', 'Malgun Gothic', 'sans-serif'" style='line-height: 15pt; letter-spacing: 0.02em; font-family: "Calibri", "Segoe UI", "Meiryo", "Microsoft YaHei UI", "Microsoft JhengHei UI", "Malgun Gothic", "sans-serif"; font-size: 12pt;'><b>От:</b>&nbsp;<a href="mailto:abc@example.com" target="_parent">Alexander L</a><br><b>Отправлено:</b>&nbsp;‎четверг‎, ‎26‎ ‎июня‎ ‎2014‎ г. ‎15‎:‎05<br><b>Кому:</b>&nbsp;<a href="mailto:alex-ninja@example.com" target="_parent">Alex</a></font></div></div><div><br></div><div dir=""><div dir="ltr"><div class="gmail_default" style="font-size: small;"><div class="gmail_default" style="font-family: arial,sans-serif;">Hello! How are you?</div><div class="gmail_default" style="font-family: arial,sans-serif;"><br>
</div><div class="gmail_default" style="font-family: arial,sans-serif;">Thanks,</div><div class="gmail_default" style="font-family: arial,sans-serif;">Sasha.</div></div></div>
</div></div>
</body>
</html>
`;

const yandex1 = `
<p>
Hi. I am fine.<br /><br />
Thanks,<br />
Alex<br /><br />
26.06.2014, 14:41, "Alexander L" &lt;<a href="mailto:abc@example.com">abc@example.com</a>&gt;:</p>
<blockquote> Hello! How are you?<br /><br /> Thanks,<br /> Sasha.</blockquote>
`;

/**
 * Mails from https://github.com/felixfw1990/email-origin/tree/master/test/Providers
 */

const aol2 = `
<div style="color:;font: 10pt Helvetica Neue;"><span style="font-family: Arial, Helvetica, sans-serif;">我的爱人</span>
    <div>
        <span style="font-family: Arial, Helvetica, sans-serif; font-weight: bold; text-decoration-line: underline; font-style: italic; background-color: red;"><font
            size="7">我爱你</font></span></div>

    <div><span style="font-family: Arial, Helvetica, sans-serif; font-weight: bold; text-decoration-line: underline; font-style: italic; background-color: red;"><font
        size="7"><br>
</font></span><br>
        <br>

        <div style="font-family:helvetica,arial;font-size:10pt;color:black">-----Original Message-----<br>
            From: felix &lt;felixfw1111@gmail.com&gt;<br>
            To: achankayi &lt;csdfsf@aol.com&gt;<br>
            Sent: Wed, Jul 3, 2019 6:10 pm<br>
            Subject: gmail to aol<br>
            <br>

            <div id="yiv5828060424">
                <div dir="ltr"><b>content1</b>
                    <div><i><u style="background-color:rgb(255,0,0);">contnet2</u></i></div>
                </div>

            </div>
        </div>
    </div>
</div>
`;

const gmail4 = `
 <div dir="ltr">
    <div dir="ltr">
        <div class = "abc", id = "sss">回复内容</divsty>
        <div dir="ltr"><b>this is content 1</b>
            <div><b><u>this is content 2</u></b></div>
        </div>
        <br><br>
        <div class="gmail_quote">
            <div dir="ltr" class="gmail_attr">冯伟 &lt;<a href="mailto:felixfw1111@gmail.com">felixfw1111@gmail.com</a>&gt;
                于2019年7月2日周二 下午5:36写道：<br></div>
            <blockquote class="gmail_quote"
                style="margin:0px 0px 0px 0.8ex;border-left-width:1px;border-left-style:solid;border-left-color:rgb(204,204,204);padding-left:1ex">
                <div dir="ltr"><b>this is content 1</b>
                    <div><b><u>this is content 2</u><br></b>
                        <div><br></div>
                    </div>
                </div>
            </blockquote>
        </div>
    </div>
</div>
`;

const gmx = `
 &#22238;&#22797;&#20869;&#23481;<br />
content1<br />
content2<br>
<br>
<div name="quote"
    style='margin:10px 5px 5px 10px; padding: 10px 0 10px 10px; border-left:2px solid #C3D9E5; word-wrap: break-word; -webkit-nbsp-mode: space; -webkit-line-break: after-white-space;'>
    <div style="margin:0 0 10px 0;">
        <b>Sent:</b>&nbsp;Tuesday, July 02, 2019 at 6:15 PM<br />
        <b>From:</b>&nbsp;&quot;冯伟&quot; &lt;felixfw1111@gmail.com&gt;<br />
        <b>To:</b>&nbsp;felixfw1111@gmx.com<br />

        <b>Subject:</b>&nbsp;gmail to gmx
    </div>
    <div name="quoted-content">
        <div><b>content1</b>
            <div><i><u style="background-color: rgb(255,0,0);">content2</u></i></div>
        </div>

    </div>
</div>
<br />
`;

const hotmail3 = `
 <html>
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=gb2312">
        <style type="text/css" style="display:none;"> P {
            margin-top: 0;
            margin-bottom: 0;
        } </style>
    </head>
    <body dir="ltr">
    <div style="font-family: Calibri, Arial, Helvetica, sans-serif; font-size: 12pt; color: rgb(0, 0, 0);">
        回复内容
    </div>
    <div id="appendonsend"></div>
    <div style="font-family:Calibri,Arial,Helvetica,sans-serif; font-size:12pt; color:rgb(0,0,0)">
        <b style="color: rgb(50, 49, 48); font-family: &quot;Segoe UI&quot;, &quot;Segoe UI Web (West European)&quot;, &quot;Segoe UI&quot;, -apple-system, system-ui, Roboto, &quot;Helvetica Neue&quot;, sans-serif; background-color: rgb(255, 255, 255)">content1</b><span
        style="color: rgb(50, 49, 48); font-family: &quot;Segoe UI&quot;, &quot;Segoe UI Web (West European)&quot;, &quot;Segoe UI&quot;, -apple-system, system-ui, Roboto, &quot;Helvetica Neue&quot;, sans-serif; background-color: rgb(255, 255, 255); display: inline !important"></span>
        <div style="margin: 0px; font-family: &quot;Segoe UI&quot;, &quot;Segoe UI Web (West European)&quot;, &quot;Segoe UI&quot;, -apple-system, system-ui, Roboto, &quot;Helvetica Neue&quot;, sans-serif; color: rgb(50, 49, 48); background-color: rgb(255, 255, 255)">
            <i><u style="background-color: rgb(255, 0, 0)">content2</u></i></div>
        <br>
    </div>
    <hr tabindex="-1" style="display:inline-block; width:98%">
    <div id="divRplyFwdMsg" dir="ltr"><font face="Calibri, sans-serif" color="#000000" style="font-size:11pt"><b>From:</b>
        冯伟 &lt;felixfw1111@gmail.com&gt;<br>
        <b>Sent:</b> Tuesday, July 2, 2019 5:43 PM<br>
        <b>To:</b> felixfw1111@hotmail.com<br>
        <b>Subject:</b> gmail to hotmail</font>
        <div>&nbsp;</div>
    </div>
    <div>
        <div dir="ltr"><b>content1</b>
            <div><i><u style="background-color:rgb(255,0,0)">content2</u></i></div>
        </div>
    </div>
    </body>
</html>
`;

const icloud = `
<html>
<body>
<div>回复内容</div>
<div>
    <meta charset="utf-8">
    <blockquote type="cite"
        style="padding: 0px 12px; border-left: 2px solid #003399; margin: 0px; color: #003399; font-family: SFNSText, 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 15px; font-style: normal; font-variant-ligatures: normal; font-variant-caps: normal; font-weight: 300; letter-spacing: normal; orphans: 2; text-align: start; text-indent: 0px; text-transform: none; white-space: normal; widows: 2; word-spacing: 0px; -webkit-text-stroke-width: 0px; background-color: #ffffff; text-decoration-style: initial; text-decoration-color: initial;"
        data-mce-style="padding: 0px 12px; border-left: 2px solid #003399; margin: 0px; color: #003399; font-family: SFNSText, 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 15px; font-style: normal; font-variant-ligatures: normal; font-variant-caps: normal; font-weight: 300; letter-spacing: normal; orphans: 2; text-align: start; text-indent: 0px; text-transform: none; white-space: normal; widows: 2; word-spacing: 0px; -webkit-text-stroke-width: 0px; background-color: #ffffff; text-decoration-style: initial; text-decoration-color: initial;">
        <div class="msg-quote">
            <div dir="ltr"><b>content1</b>
                <div><i><u data-mce-style="background-color: #ff0000;" style="background-color: rgb(255, 0, 0);">content2</u></i>
                </div>
            </div>
        </div>
    </blockquote>
</div>
<div><br>2019年7月2日 上午2:59，冯伟 &lt;felixfw1111@gmail.com&gt; 写道：<br><br></div>
<div>
    <blockquote type="cite">
        <div class="msg-quote">
            <div dir="ltr"><b>content1</b>
                <div><i><u style="background-color: #ff0000;"
                    data-mce-style="background-color: #ff0000;">content2</u></i></div>
            </div>
        </div>
    </blockquote>
</div>
<audio controls="controls" style="display: none;"></audio>
</body>
</html>
`;

const netease = `
回复内容<br>content1<br>content2<br><br>At 2019-07-04 11:20:38, "冯伟" &lt;felixfw1111@gmail.com&gt; wrote:<br>
<blockquote id="isReplyContent" style="PADDING-LEFT: 1ex; MARGIN: 0px 0px 0px 0.8ex; BORDER-LEFT: #ccc 1px solid">
    <div dir="ltr"><b>content1</b>
        <div><i><u style="background-color:rgb(255,0,0)">content2</u></i></div>
    </div>
</blockquote><br><br><span title="neteasefooter"><p>&nbsp;</p></span>
`;

const outlook2 = `
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=gb2312">
    <style type="text/css" style="display:none;"> P {
        margin-top: 0;
        margin-bottom: 0;
    } </style>
</head>
<body dir="ltr">
<div style="font-family: Calibri, Arial, Helvetica, sans-serif; font-size: 12pt; color: rgb(0, 0, 0);">
    回复内容
</div>
<div id="appendonsend"></div>
<div style="font-family:Calibri,Arial,Helvetica,sans-serif; font-size:12pt; color:rgb(0,0,0)">
    <b style="color: rgb(50, 49, 48); font-family: &quot;Segoe UI&quot;, &quot;Segoe UI Web (West European)&quot;, &quot;Segoe UI&quot;, -apple-system, system-ui, Roboto, &quot;Helvetica Neue&quot;, sans-serif; background-color: rgb(255, 255, 255)">content1</b><span
    style="color: rgb(50, 49, 48); font-family: &quot;Segoe UI&quot;, &quot;Segoe UI Web (West European)&quot;, &quot;Segoe UI&quot;, -apple-system, system-ui, Roboto, &quot;Helvetica Neue&quot;, sans-serif; background-color: rgb(255, 255, 255); display: inline !important"></span>
    <div style="margin: 0px; font-family: &quot;Segoe UI&quot;, &quot;Segoe UI Web (West European)&quot;, &quot;Segoe UI&quot;, -apple-system, system-ui, Roboto, &quot;Helvetica Neue&quot;, sans-serif; color: rgb(50, 49, 48); background-color: rgb(255, 255, 255)">
        <i><u style="background-color: rgb(255, 0, 0)">content2</u></i></div>
    <br>
</div>
<hr tabindex="-1" style="display:inline-block; width:98%">
<div id="divRplyFwdMsg" dir="ltr"><font face="Calibri, sans-serif" color="#000000" style="font-size:11pt"><b>From:</b>
    冯伟 &lt;felixfw1111@gmail.com&gt;<br>
    <b>Sent:</b> Tuesday, July 2, 2019 5:43 PM<br>
    <b>To:</b> felixfw1111@hotmail.com<br>
    <b>Subject:</b> gmail to hotmail</font>
    <div>&nbsp;</div>
</div>
<div>
    <div dir="ltr"><b>content1</b>
        <div><i><u style="background-color:rgb(255,0,0)">content2</u></i></div>
    </div>
</div>
</body>
</html>
`;

const proton2 = `
<div>回复内容<br></div>
<blockquote type="cite" class="protonmail_quote">
    <div dir="ltr">
        <div><b>content1</b><br></div>
    </div>
</blockquote>
<div><br></div>
<div class="protonmail_signature_block">
    <div class="protonmail_signature_block-user protonmail_signature_block-empty"><br></div>
    <div class="protonmail_signature_block-proton">Sent with <a href="https://protonmail.com"
        target="_blank">ProtonMail</a> Secure Email.<br></div>
</div>
<div><br></div>
<div>‐‐‐‐‐‐‐ Original Message ‐‐‐‐‐‐‐<br></div>
<div> 星期二, 七月 2, 2019 6:09 晚上，冯伟 &lt;felixfw1111@gmail.com&gt; 来信：<br></div>
<div><br></div>
<blockquote class="protonmail_quote" type="cite">
    <div dir="ltr">
        <div><b>content1</b><br></div>
        <div><i><u style="background-color:rgb(255,0,0)">content2</u></i><br></div>
    </div>
</blockquote>
<div><br></div>
`;

const sina = `
回复内容<br />content1<br />content2<br />
<div id="origbody">
    <div style="background: #f2f2f2;">----- 原始邮件 -----<br />发件人：冯伟 &lt;felixfw1111@gmail.com&gt;<br />收件人：felixfw1111@sina.com<br />主题：gmail
        to sina<br />日期：2019年07月04日 11点27分<br /></div>
    <br />
    <div dir="ltr"><b>content1</b>
        <div><i><u style="background-color:rgb(255,0,0)">content2</u></i></div>
    </div>

</div>
`;

const tencent = `
<font color="#800000" face="幼圆">回复内容</font>
<div><b style="font-family: &quot;lucida Grande&quot;, Verdana;">content1</b>
    <div style="font-family: &quot;lucida Grande&quot;, Verdana;"><i><u style="background-color: rgb(255, 0, 0);">contnet2</u></i>
    </div>
</div>
<div><br></div>
<div><br></div>
<div style="font-size: 12px;font-family: Arial Narrow;padding:2px 0 2px 0;">------------------&nbsp;原始邮件&nbsp;------------------</div>
<div style="font-size: 12px;background:#efefef;padding:8px;">
    <div><b>发件人:</b> "felixfw1111"&lt;felixfw1111@gmail.com&gt;;</div>
    <div><b>发送时间:</b> 2019年7月4日(星期四) 中午11:18</div>
    <div><b>收件人:</b> "IT贫民"&lt;758185812@qq.com&gt;;</div>
    <div><b>主题:</b> gmail to tencent</div>
</div>
<div><br></div>
<div dir="ltr"><b>content1</b>
    <div><i><u style="background-color:rgb(255,0,0)">contnet2</u></i></div>
</div>

<style type="text/css">.qmbox style, .qmbox script, .qmbox head, .qmbox link, .qmbox meta {
    display: none !important;
}</style> 
`;

const yahoo = `
<html>
<head></head>
<body>
<div class="ydp4ec1323dyahoo-style-wrap"
    style="font-family:Helvetica Neue, Helvetica, Arial, sans-serif;font-size:16px;">
    <div></div>
    <div><br></div>
    <div dir="ltr" data-setdir="false">回复内容</div>
    <div dir="ltr" data-setdir="false">
        <div>
            <div data-test-id="message-view-body" class="ydp7263f265I_52qC ydp7263f265D_FY">
                <div class="ydp7263f265msg-body ydp7263f265P_wpofO ydp7263f265iy_A"
                    data-test-id="message-view-body-content">
                    <div class="ydp7263f265jb_0 ydp7263f265X_6MGW ydp7263f265N_6Fd5">
                        <div id="ydp7263f265yiv3306508764">
                            <div dir="ltr"><b>content1</b>
                                <div><i><u style="background-color: rgb(255, 0, 0);">content2</u></i></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="ydp7263f265jb_0 ydp7263f265X_6MGW ydp7263f265N_6Fd5"></div>
            </div>
            <div class="ydp7263f265H_7jIs ydp7263f265D_F ydp7263f265ab_C ydp7263f265Q_69H5 ydp7263f265E_36RhU"
                data-test-id="toolbar-hover-area">
                <div class="ydp7263f265D_F ydp7263f265W_6D6F ydp7263f265r_BN ydp7263f265gl_C"
                    data-test-id="card-toolbar"
                    style="width: 903.406px;"></div>
            </div>
        </div>
        <br></div>

</div>
<div id="yahoo_quoted_2158811873" class="yahoo_quoted">
    <div style="font-family:'Helvetica Neue', Helvetica, Arial, sans-serif;font-size:13px;color:#26282a;">

        <div>
            冯伟 (&lt;felixfw1111@gmail.com&gt;) 在 2019年7月2日星期二 下午05:48:53 [GMT+8] 寫道：
        </div>
        <div><br></div>
        <div><br></div>
        <div>
            <div id="yiv3306508764">
                <div dir="ltr"><b>content1</b>
                    <div><i><u style="background-color:rgb(255,0,0);">content2</u></i></div>
                </div>
            </div>
        </div>
    </div>
</div>
</body>
</html>
`;

const yandex2 = `
<div>回复内容</div>
<div>
    <b style="background-color:rgb( 255 , 255 , 255 );color:rgb( 0 , 0 , 0 );font-family:'arial' , sans-serif;font-size:15px;font-style:normal;text-decoration-style:initial;text-transform:none;white-space:normal;word-spacing:0px">content1</b>
    <div style="background-color:rgb( 255 , 255 , 255 );color:rgb( 0 , 0 , 0 );font-family:'arial' , sans-serif;font-size:15px;font-style:normal;font-weight:400;text-decoration-style:initial;text-transform:none;white-space:normal;word-spacing:0px">
        <i><u style="background-color:rgb( 255 , 0 , 0 )">content2</u></i></div>
</div>
<div><br /></div>
<div><br /></div>
<div>03.07.2019, 10:27, "冯伟" &lt;felixfw1111@gmail.com&gt;:</div>
<blockquote>
    <div dir="ltr"><b>content1</b>
        <div><i><u style="background-color:rgb( 255 , 0 , 0 )">content2</u></i></div>
    </div>
</blockquote>
`;

const zoho = `
<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<html>
<head>
    <meta content="text/html;charset=UTF-8" http-equiv="Content-Type">
</head>
<body>
<div style="font-family: Verdana, Arial, Helvetica, sans-serif; font-size: 10pt;">
    <div>回复内容<br></div>
    <div class="zmail_extra" style="">
        <blockquote style="border-left: 1px solid rgb(204, 204, 204); padding-left: 6px; margin: 0px 0px 0px 5px;">
            <div>
                <div dir="ltr"><b>content1</b>
                    <div><i><u style="background-color:rgb(255,0,0);">content2</u></i><br></div>
                </div>
            </div>
        </blockquote>
    </div>
    <br>
    <div id="Zm-_Id_-Sgn"><p style=""><span class="colour" style="color:rgb(42, 42, 42)">使用<a target="_blank"
        href="https://www.zoho.com.cn/mail/"
        style="color:#598fde;">Zoho Mail</a>发送</span><br></p></div>
    <br>
    <div style="" class="zmail_extra"><br>
        <div id="Zm-_Id_-Sgn1">---- 在 星期二, 02 七月 2019 17:55:32 +0800 <b>冯伟 &lt;felixfw1111@gmail.com&gt;</b> 撰写 ----<br>
        </div>
        <br>
        <blockquote style="border-left: 1px solid rgb(204, 204, 204); padding-left: 6px; margin: 0px 0px 0px 5px;">
            <div>
                <div dir="ltr"><b>content1</b>
                    <div><i><u style="background-color:rgb(255,0,0);">content2</u></i><br></div>
                </div>
            </div>
        </blockquote>
    </div>
    <div><br></div>
</div>
<br></body>
</html>
`;

export default {
    proton1,
    proton2,
    gmail1,
    gmail2,
    gmail3,
    gmail4,
    gmx,
    android,
    aol1,
    aol2,
    icloud, // multiple same level blockquote
    netease,
    sina,
    thunderbird,
    yahoo,
    zoho,
};

export const unsuported /* yet? */ = {
    comcast, // hr
    hotmail1, // almost nothing
    hotmail2, // hr
    hotmail3, // hr
    outlook1, // ??
    outlook2, // hr
    outlook2003, // hr
    outlook2007, // almost nothing
    outlook2010, // almost nothing
    sparrow, // really exists?
    tencent, // text separator + not including
    windows_mail, // almost nothing
    yandex1, // only blockquote
    yandex2, // only blockquote
};
