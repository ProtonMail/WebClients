import { transformBodyClasses } from './transformBodyClasses';

describe('transformBodyClasses', () => {
    const originalClasses = [
        '<script></script>',
        '<script src="https://mail.proton.me/test.js"></script>',
        '<script>console.log("hello")</script>',
        '<script>document.write("hello")</script>',
        'class-pre<script>console.log("hello")</script>',
        'class-pre class-pre-2<script>console.log("hello")</script>',
        '<script>console.log("hello")</script>class-post',
        `<script> 
        console.log("hello")
        </script>class-post`,
        '<script>console.log("hello")</script>class-post class-post-2',
        'class-pre<script>console.log("hello")</script>class-post',
        'class-pre   <script>console.log("hello")</script>   class-post',
        `
        class-pre
        <script>console.log("hello")</script>
        class-post
        `,
        // Encoded version
        '&lt;script&gt;&lt;/script&gt;',
        '&lt;script src=&quot;https://mail.proton.me/test.js&quot;&gt;&lt;/script&gt;',
        '&lt;script&gt;console.log(&quot;hello&quot;)&lt;/script&gt;',
        '&lt;script&gt;document.write(&quot;hello&quot;)&lt;/script&gt;',
        'class-pre&lt;script&gt;console.log(&quot;hello&quot;)&lt;/script&gt;',
        'class-pre class-pre-2&lt;script&gt;console.log(&quot;hello&quot;)&lt;/script&gt;',
        '&lt;script&gt;console.log(&quot;hello&quot;)&lt;/script&gt;class-post',
        `&lt;script&gt; 
        console.log(&quot;hello&quot;)
        &lt;/script&gt;class-post`,
        '&lt;script&gt;console.log(&quot;hello&quot;)&lt;/script&gt;class-post class-post-2',
        'class-pre&lt;script&gt;console.log(&quot;hello&quot;)&lt;/script&gt;class-post',
        'class-pre  &lt;script&gt;console.log(&quot;hello&quot;)&lt;/script&gt;  class-post',
        `
        class-pre
        &lt;script&gt;console.log(&quot;hello&quot;)&lt;/script&gt;
        class-post
        `,
    ];

    const transformedClasses = [
        '',
        '',
        '',
        '',
        'class-pre',
        'class-pre class-pre-2',
        'class-post',
        'class-post',
        'class-post class-post-2',
        'class-pre class-post',
        'class-pre class-post',
        'class-pre class-post',
        // Encoded version
        '',
        '',
        '',
        '',
        'class-pre',
        'class-pre class-pre-2',
        'class-post',
        'class-post',
        'class-post class-post-2',
        'class-pre class-post',
        'class-pre class-post',
        'class-pre class-post',
    ];

    for (const [index, originalClass] of originalClasses.entries()) {
        it(`should transform: ${originalClass}`, () => {
            const transformedBodyClasses = transformBodyClasses(originalClass);
            expect(transformedBodyClasses).toEqual(transformedClasses[index]);
        });
    }
});
