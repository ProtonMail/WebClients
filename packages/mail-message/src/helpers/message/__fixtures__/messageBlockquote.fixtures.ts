import { ORIGINAL_MESSAGE } from '@proton/shared/lib/mail/messages';

/**
 * Mails extracted by us
 */

const proton1 = `
    <div><br></div>
    <div><br></div>
    <div class="protonmail_signature_block">
        <div class="protonmail_signature_block-user protonmail_signature_block-empty"><br></div>
        <div class="protonmail_signature_block-proton">Sent with <a href="https://proton.me/?utm_campaign=ww-all-2a-mail-pmm_mail-protonmail_signature&utm_source=proton_users&utm_medium=cta&utm_content=sent_with_protonmail_secure_email" target="_blank">ProtonMail</a> Secure Email.<br></div>
    </div>
    <div><br></div>
    <div class="protonmail_quote">
        <div>${ORIGINAL_MESSAGE}<br></div>
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
            <blockquote style="margin:0px 0px 0px 0.8ex;border-inline-start:1px solid rgb(204,204,204);padding-inline-start:1ex" class="gmail_quote">
                <div>
                    <div>2<br></div><div><br></div><div><div><br></div><div>Sent with <a target="_blank" href="https://proton.me/?utm_campaign=ww-all-2a-mail-pmm_mail-protonmail_signature&utm_source=proton_users&utm_medium=cta&utm_content=sent_with_protonmail_secure_email" rel="noreferrer nofollow noopener">ProtonMail</a> Secure Email.<br></div></div><div><br></div><span>${ORIGINAL_MESSAGE}</span><br>
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
<blockquote class="gmail_quote" style="margin:0 0 0 .8ex;border-inline-start:1px #ccc solid;padding-inline-start:1ex">Hi<br>
</blockquote></div>
 `;

const aol1 = `
 <font color='black' size='2' face='arial'>Hello<br>
 <span>toto</span>
 <span>${ORIGINAL_MESSAGE}</span>
 <br>
 <br>

 <div style="font-family:arial,helvetica;font-size:10pt;color:black">${ORIGINAL_MESSAGE}<br>
 From: bob &lt;bob@example.com&gt;<br>
 To: xxx &lt;xxx@gmail.com&gt;; xxx &lt;xxx@hotmail.com&gt;; xxx &lt;xxx@yahoo.com&gt;; xxx &lt;xxx@aol.com&gt;; xxx &lt;xxx@comcast.net&gt;; xxx &lt;xxx@nyc.rr.com&gt;<br>
 Sent: Mon, Apr 2, 2012 5:49 pm<br>
 Subject: Test<br>

 <br>


 <span>${ORIGINAL_MESSAGE}</span>




 <div id="AOLMsgPart_0_4d68a632-fe65-4f6d-ace2-292ac1b91f1f" style="margin: 0px;font-family: Tahoma, Verdana, Arial, Sans-Serif;font-size: 12px;color: #000;background-color: #fff;">

 <pre style="font-size: 9pt;"><tt>Hi
 </tt></pre>
 </div>
  <!-- end of AOLMsgPart_0_4d68a632-fe65-4f6d-ace2-292ac1b91f1f -->



 </div>
 </font>
 `;

const gmail2 = `
Hello<br><br><div class="gmail_quote">On Mon, Apr 2, 2012 at 6:26 PM, Megan One <span dir="ltr">&lt;<a href="mailto:xxx@gmail.com">xxx@gmail.com</a>&gt;</span> wrote:<br><blockquote class="gmail_quote" style="margin:0 0 0 .8ex;border-inline-start:1px #ccc solid;padding-inline-start:1ex">
Hi

</blockquote></div><br>
`;

const gmail3 = `
<div dir="ltr"><div class="gmail_default"><div class="gmail_default" style>Hi. I am fine.</div><div class="gmail_default" style><br></div><div class="gmail_default" style>Thanks,</div><div class="gmail_default" style>Alex</div>
</div></div><div class="gmail_extra"><br><br><div class="gmail_quote">On Thu, Jun 26, 2014 at 2:14 PM, Alexander L <span dir="ltr">&lt;<a href="mailto:abc@example.com" target="_blank">a@example.com</a>&gt;</span> wrote:<br>
<blockquote class="gmail_quote" style="margin:0 0 0 .8ex;border-inline-start:1px #ccc solid;padding-inline-start:1ex"><div dir="ltr"><div class="gmail_default" style="font-size:small"><div class="gmail_default" style="font-family:arial,sans-serif">
Hello! How are you?</div><div class="gmail_default" style="font-family:arial,sans-serif"><br>
</div><div class="gmail_default" style="font-family:arial,sans-serif">Thanks,</div><div class="gmail_default" style="font-family:arial,sans-serif">Sasha.</div></div></div>
</blockquote></div><br></div>
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

        <div style="font-family:helvetica,arial;font-size:10pt;color:black">${ORIGINAL_MESSAGE}<br>
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
                style="margin-block:0; margin-inline: 0.8ex 0;border-inline-start-width:1px;border-inline-start-style:solid;border-inline-start-color:rgb(204,204,204);padding-inline-start:1ex">
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
    style='margin-block: 10px 5px; margin-inline: 10px 5px; padding-block: 10px; padding-inline: 10px 0; border-inline-start:2px solid #C3D9E5; word-wrap: break-word; -webkit-nbsp-mode: space; -webkit-line-break: after-white-space;'>
    <div style="margin-block: 0 10px; margin-inline: 0;">
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

const icloud = `
<html>
<body>
<div>回复内容</div>
<div>
    <meta charset="utf-8">
    <blockquote type="cite"
        style="padding-block: 0; padding-inline: 12px; border-inline-start: 2px solid #003399; margin: 0px; color: #003399; font-family: SFNSText, 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 15px; font-style: normal; font-variant-ligatures: normal; font-variant-caps: normal; font-weight: 300; letter-spacing: normal; orphans: 2; text-align: start; text-indent: 0px; text-transform: none; white-space: normal; widows: 2; word-spacing: 0px; -webkit-text-stroke-width: 0px; background-color: #ffffff; text-decoration-style: initial; text-decoration-color: initial;"
        data-mce-style="padding-block: 0; padding-inline: 12px; border-inline-start: 2px solid #003399; margin: 0px; color: #003399; font-family: SFNSText, 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 15px; font-style: normal; font-variant-ligatures: normal; font-variant-caps: normal; font-weight: 300; letter-spacing: normal; orphans: 2; text-align: start; text-indent: 0px; text-transform: none; white-space: normal; widows: 2; word-spacing: 0px; -webkit-text-stroke-width: 0px; background-color: #ffffff; text-decoration-style: initial; text-decoration-color: initial;">
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
<blockquote id="isReplyContent" style="padding-inline-start: 1ex; margin-block: 0; margin-inline: 0.8ex 0; border-inline-start: #ccc 1px solid">
    <div dir="ltr"><b>content1</b>
        <div><i><u style="background-color:rgb(255,0,0)">content2</u></i></div>
    </div>
</blockquote><br><br><span title="neteasefooter"><p>&nbsp;</p></span>
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
    <div class="protonmail_signature_block-proton">Sent with <a href="https://proton.me/?utm_campaign=ww-all-2a-mail-pmm_mail-protonmail_signature&utm_source=proton_users&utm_medium=cta&utm_content=sent_with_protonmail_secure_emailttps://proton.me"
        target="_blank">ProtonMail</a> Secure Email.<br></div>
</div>
<div><br></div>
<div>${ORIGINAL_MESSAGE}<br></div>
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
            <div data-testid="message-view-body" class="ydp7263f265I_52qC ydp7263f265D_FY">
                <div class="ydp7263f265msg-body ydp7263f265P_wpofO ydp7263f265iy_A"
                    data-testid="message-view-body-content">
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
                data-testid="toolbar-hover-area">
                <div class="ydp7263f265D_F ydp7263f265W_6D6F ydp7263f265r_BN ydp7263f265gl_C"
                    data-testid="card-toolbar"
                    style="inline-size: 903.406px;"></div>
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
        <blockquote style="border-inline-start: 1px solid rgb(204, 204, 204); padding-inline-start: 6px; margin-block: 0; margin-inline: 5px 0;">
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
        <blockquote style="border-inline-start: 1px solid rgb(204, 204, 204); padding-inline-start: 6px; margin-block: 0; margin-inline: 5px 0;">
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
