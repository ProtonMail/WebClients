import { DAY } from '@proton/shared/lib/constants';

import { KT_CERTIFICATE_ISSUER } from './constants';

/**
 * This file contains hardcoded data that becomes obsolete after KT_DATA_VALIDITY_PERIOD
 * has elapsed since the timestamp recorded in the ctLogs list. If the data expires
 * key transparency is disabled.
 * Thus, it is imperative to regularly update this data within specified intervals to ensure
 * the continuous operation of key transparency.
 */
export const KT_DATA_VALIDITY_PERIOD = 185 * DAY;

const letsEncryptCerts: string[] = [
    // ISRGRootX1:
    '-----BEGIN CERTIFICATE-----\nMIIFazCCA1OgAwIBAgIRAIIQz7DSQONZRGPgu2OCiwAwDQYJKoZIhvcNAQELBQAw\nTzELMAkGA1UEBhMCVVMxKTAnBgNVBAoTIEludGVybmV0IFNlY3VyaXR5IFJlc2Vh\ncmNoIEdyb3VwMRUwEwYDVQQDEwxJU1JHIFJvb3QgWDEwHhcNMTUwNjA0MTEwNDM4\nWhcNMzUwNjA0MTEwNDM4WjBPMQswCQYDVQQGEwJVUzEpMCcGA1UEChMgSW50ZXJu\nZXQgU2VjdXJpdHkgUmVzZWFyY2ggR3JvdXAxFTATBgNVBAMTDElTUkcgUm9vdCBY\nMTCCAiIwDQYJKoZIhvcNAQEBBQADggIPADCCAgoCggIBAK3oJHP0FDfzm54rVygc\nh77ct984kIxuPOZXoHj3dcKi/vVqbvYATyjb3miGbESTtrFj/RQSa78f0uoxmyF+\n0TM8ukj13Xnfs7j/EvEhmkvBioZxaUpmZmyPfjxwv60pIgbz5MDmgK7iS4+3mX6U\nA5/TR5d8mUgjU+g4rk8Kb4Mu0UlXjIB0ttov0DiNewNwIRt18jA8+o+u3dpjq+sW\nT8KOEUt+zwvo/7V3LvSye0rgTBIlDHCNAymg4VMk7BPZ7hm/ELNKjD+Jo2FR3qyH\nB5T0Y3HsLuJvW5iB4YlcNHlsdu87kGJ55tukmi8mxdAQ4Q7e2RCOFvu396j3x+UC\nB5iPNgiV5+I3lg02dZ77DnKxHZu8A/lJBdiB3QW0KtZB6awBdpUKD9jf1b0SHzUv\nKBds0pjBqAlkd25HN7rOrFleaJ1/ctaJxQZBKT5ZPt0m9STJEadao0xAH0ahmbWn\nOlFuhjuefXKnEgV4We0+UXgVCwOPjdAvBbI+e0ocS3MFEvzG6uBQE3xDk3SzynTn\njh8BCNAw1FtxNrQHusEwMFxIt4I7mKZ9YIqioymCzLq9gwQbooMDQaHWBfEbwrbw\nqHyGO0aoSCqI3Haadr8faqU9GY/rOPNk3sgrDQoo//fb4hVC1CLQJ13hef4Y53CI\nrU7m2Ys6xt0nUW7/vGT1M0NPAgMBAAGjQjBAMA4GA1UdDwEB/wQEAwIBBjAPBgNV\nHRMBAf8EBTADAQH/MB0GA1UdDgQWBBR5tFnme7bl5AFzgAiIyBpY9umbbjANBgkq\nhkiG9w0BAQsFAAOCAgEAVR9YqbyyqFDQDLHYGmkgJykIrGF1XIpu+ILlaS/V9lZL\nubhzEFnTIZd+50xx+7LSYK05qAvqFyFWhfFQDlnrzuBZ6brJFe+GnY+EgPbk6ZGQ\n3BebYhtF8GaV0nxvwuo77x/Py9auJ/GpsMiu/X1+mvoiBOv/2X/qkSsisRcOj/KK\nNFtY2PwByVS5uCbMiogziUwthDyC3+6WVwW6LLv3xLfHTjuCvjHIInNzktHCgKQ5\nORAzI4JMPJ+GslWYHb4phowim57iaztXOoJwTdwJx4nLCgdNbOhdjsnvzqvHu7Ur\nTkXWStAmzOVyyghqpZXjFaH3pO3JLF+l+/+sKAIuvtd7u+Nxe5AW0wdeRlN8NwdC\njNPElpzVmbUq4JUagEiuTDkHzsxHpFKVK7q4+63SM1N95R1NbdWhscdCb+ZAJzVc\noyi3B43njTOQ5yOf+1CceWxG1bQVs5ZufpsMljq4Ui0/1lvh+wjChP4kqKOJ2qxq\n4RgqsahDYVvTH9w7jXbyLeiNdd8XM2w9U/t7y0Ff/9yi0GE44Za4rF2LN9d11TPA\nmRGunUHBcnWEvgJBQl9nJEiU0Zsnvgc/ubhPgXRR4Xq37Z0j4r7g1SgEEzwxA57d\nemyPxgcYxn/eR44/KJ4EBs+lVDR3veyJm+kXQ99b21/+jh5Xos1AnX5iItreGCc=\n-----END CERTIFICATE-----',
    // ISRGRootX1_crossSigned:
    '-----BEGIN CERTIFICATE-----\nMIIFYDCCBEigAwIBAgIQQAF3ITfU6UK47naqPGQKtzANBgkqhkiG9w0BAQsFADA/\nMSQwIgYDVQQKExtEaWdpdGFsIFNpZ25hdHVyZSBUcnVzdCBDby4xFzAVBgNVBAMT\nDkRTVCBSb290IENBIFgzMB4XDTIxMDEyMDE5MTQwM1oXDTI0MDkzMDE4MTQwM1ow\nTzELMAkGA1UEBhMCVVMxKTAnBgNVBAoTIEludGVybmV0IFNlY3VyaXR5IFJlc2Vh\ncmNoIEdyb3VwMRUwEwYDVQQDEwxJU1JHIFJvb3QgWDEwggIiMA0GCSqGSIb3DQEB\nAQUAA4ICDwAwggIKAoICAQCt6CRz9BQ385ueK1coHIe+3LffOJCMbjzmV6B493XC\nov71am72AE8o295ohmxEk7axY/0UEmu/H9LqMZshftEzPLpI9d1537O4/xLxIZpL\nwYqGcWlKZmZsj348cL+tKSIG8+TA5oCu4kuPt5l+lAOf00eXfJlII1PoOK5PCm+D\nLtFJV4yAdLbaL9A4jXsDcCEbdfIwPPqPrt3aY6vrFk/CjhFLfs8L6P+1dy70sntK\n4EwSJQxwjQMpoOFTJOwT2e4ZvxCzSow/iaNhUd6shweU9GNx7C7ib1uYgeGJXDR5\nbHbvO5BieebbpJovJsXQEOEO3tkQjhb7t/eo98flAgeYjzYIlefiN5YNNnWe+w5y\nsR2bvAP5SQXYgd0FtCrWQemsAXaVCg/Y39W9Eh81LygXbNKYwagJZHduRze6zqxZ\nXmidf3LWicUGQSk+WT7dJvUkyRGnWqNMQB9GoZm1pzpRboY7nn1ypxIFeFntPlF4\nFQsDj43QLwWyPntKHEtzBRL8xurgUBN8Q5N0s8p0544fAQjQMNRbcTa0B7rBMDBc\nSLeCO5imfWCKoqMpgsy6vYMEG6KDA0Gh1gXxG8K28Kh8hjtGqEgqiNx2mna/H2ql\nPRmP6zjzZN7IKw0KKP/32+IVQtQi0Cdd4Xn+GOdwiK1O5tmLOsbdJ1Fu/7xk9TND\nTwIDAQABo4IBRjCCAUIwDwYDVR0TAQH/BAUwAwEB/zAOBgNVHQ8BAf8EBAMCAQYw\nSwYIKwYBBQUHAQEEPzA9MDsGCCsGAQUFBzAChi9odHRwOi8vYXBwcy5pZGVudHJ1\nc3QuY29tL3Jvb3RzL2RzdHJvb3RjYXgzLnA3YzAfBgNVHSMEGDAWgBTEp7Gkeyxx\n+tvhS5B1/8QVYIWJEDBUBgNVHSAETTBLMAgGBmeBDAECATA/BgsrBgEEAYLfEwEB\nATAwMC4GCCsGAQUFBwIBFiJodHRwOi8vY3BzLnJvb3QteDEubGV0c2VuY3J5cHQu\nb3JnMDwGA1UdHwQ1MDMwMaAvoC2GK2h0dHA6Ly9jcmwuaWRlbnRydXN0LmNvbS9E\nU1RST09UQ0FYM0NSTC5jcmwwHQYDVR0OBBYEFHm0WeZ7tuXkAXOACIjIGlj26Ztu\nMA0GCSqGSIb3DQEBCwUAA4IBAQAKcwBslm7/DlLQrt2M51oGrS+o44+/yQoDFVDC\n5WxCu2+b9LRPwkSICHXM6webFGJueN7sJ7o5XPWioW5WlHAQU7G75K/QosMrAdSW\n9MUgNTP52GE24HGNtLi1qoJFlcDyqSMo59ahy2cI2qBDLKobkx/J3vWraV0T9VuG\nWCLKTVXkcGdtwlfFRjlBz4pYg1htmf5X6DYO8A4jqv2Il9DjXA6USbW1FzXSLr9O\nhe8Y4IWS6wY7bCkjCWDcRQJMEhg76fsO3txE+FiYruq9RUWhiF1myv4Q6W+CyBFC\nDfvp7OOGAN6dEOM4+qR9sdjoSYKEBpsr6GtPAQw4dy753ec5\n-----END CERTIFICATE-----',
    // ISRGRootX2:
    '-----BEGIN CERTIFICATE-----\nMIICGzCCAaGgAwIBAgIQQdKd0XLq7qeAwSxs6S+HUjAKBggqhkjOPQQDAzBPMQsw\nCQYDVQQGEwJVUzEpMCcGA1UEChMgSW50ZXJuZXQgU2VjdXJpdHkgUmVzZWFyY2gg\nR3JvdXAxFTATBgNVBAMTDElTUkcgUm9vdCBYMjAeFw0yMDA5MDQwMDAwMDBaFw00\nMDA5MTcxNjAwMDBaME8xCzAJBgNVBAYTAlVTMSkwJwYDVQQKEyBJbnRlcm5ldCBT\nZWN1cml0eSBSZXNlYXJjaCBHcm91cDEVMBMGA1UEAxMMSVNSRyBSb290IFgyMHYw\nEAYHKoZIzj0CAQYFK4EEACIDYgAEzZvVn4CDCuwJSvMWSj5cz3es3mcFDR0HttwW\n+1qLFNvicWDEukWVEYmO6gbf9yoWHKS5xcUy4APgHoIYOIvXRdgKam7mAHf7AlF9\nItgKbppbd9/w+kHsOdx1ymgHDB/qo0IwQDAOBgNVHQ8BAf8EBAMCAQYwDwYDVR0T\nAQH/BAUwAwEB/zAdBgNVHQ4EFgQUfEKWrt5LSDv6kviejM9ti6lyN5UwCgYIKoZI\nzj0EAwMDaAAwZQIwe3lORlCEwkSHRhtFcP9Ymd70/aTSVaYgLXTWNLxBo1BfASdW\ntL4ndQavEi51mI38AjEAi/V3bNTIZargCyzuFJ0nN6T5U6VR5CmD1/iQMVtCnwr1\n/q4AaOeMSQ+2b1tbFfLn\n-----END CERTIFICATE-----',
    // ISRGRootX2_crossSigned
    '-----BEGIN CERTIFICATE-----\nMIIEYDCCAkigAwIBAgIQB55JKIY3b9QISMI/xjHkYzANBgkqhkiG9w0BAQsFADBP\nMQswCQYDVQQGEwJVUzEpMCcGA1UEChMgSW50ZXJuZXQgU2VjdXJpdHkgUmVzZWFy\nY2ggR3JvdXAxFTATBgNVBAMTDElTUkcgUm9vdCBYMTAeFw0yMDA5MDQwMDAwMDBa\nFw0yNTA5MTUxNjAwMDBaME8xCzAJBgNVBAYTAlVTMSkwJwYDVQQKEyBJbnRlcm5l\ndCBTZWN1cml0eSBSZXNlYXJjaCBHcm91cDEVMBMGA1UEAxMMSVNSRyBSb290IFgy\nMHYwEAYHKoZIzj0CAQYFK4EEACIDYgAEzZvVn4CDCuwJSvMWSj5cz3es3mcFDR0H\nttwW+1qLFNvicWDEukWVEYmO6gbf9yoWHKS5xcUy4APgHoIYOIvXRdgKam7mAHf7\nAlF9ItgKbppbd9/w+kHsOdx1ymgHDB/qo4HlMIHiMA4GA1UdDwEB/wQEAwIBBjAP\nBgNVHRMBAf8EBTADAQH/MB0GA1UdDgQWBBR8Qpau3ktIO/qS+J6Mz22LqXI3lTAf\nBgNVHSMEGDAWgBR5tFnme7bl5AFzgAiIyBpY9umbbjAyBggrBgEFBQcBAQQmMCQw\nIgYIKwYBBQUHMAKGFmh0dHA6Ly94MS5pLmxlbmNyLm9yZy8wJwYDVR0fBCAwHjAc\noBqgGIYWaHR0cDovL3gxLmMubGVuY3Iub3JnLzAiBgNVHSAEGzAZMAgGBmeBDAEC\nATANBgsrBgEEAYLfEwEBATANBgkqhkiG9w0BAQsFAAOCAgEAG38lK5B6CHYAdxjh\nwy6KNkxBfr8XS+Mw11sMfpyWmG97sGjAJETM4vL80erb0p8B+RdNDJ1V/aWtbdIv\nP0tywC6uc8clFlfCPhWt4DHRCoSEbGJ4QjEiRhrtekC/lxaBRHfKbHtdIVwH8hGR\nIb/hL8Lvbv0FIOS093nzLbs3KvDGsaysUfUfs1oeZs5YBxg4f3GpPIO617yCnpp2\nD56wKf3L84kHSBv+q5MuFCENX6+Ot1SrXQ7UW0xx0JLqPaM2m3wf4DtVudhTU8yD\nZrtK3IEGABiL9LPXSLETQbnEtp7PLHeOQiALgH6fxatI27xvBI1sRikCDXCKHfES\nc7ZGJEKeKhcY46zHmMJyzG0tdm3dLCsmlqXPIQgb5dovy++fc5Ou+DZfR4+XKM6r\n4pgmmIv97igyIintTJUJxCD6B+GGLET2gUfA5GIy7R3YPEiIlsNekbave1mk7uOG\nnMeIWMooKmZVm4WAuR3YQCvJHBM8qevemcIWQPb1pK4qJWxSuscETLQyu/w4XKAM\nYXtX7HdOUM+vBqIPN4zhDtLTLxq9nHE+zOH40aijvQT2GcD5hq/1DhqqlWvvykdx\nS2McTZbbVSMKnQ+BdaDmQPVkRgNuzvpqfQbspDQGdNpT2Lm4xiN9qfgqLaSCpi4t\nEcrmzTFYeYXmchynn9NM0GbQp7s=\n-----END CERTIFICATE-----',
];

const zeroSSLCerts: string[] = [
    // USERTrust:
    '-----BEGIN CERTIFICATE-----\nMIIF3jCCA8agAwIBAgIQAf1tMPyjylGoG7xkDjUDLTANBgkqhkiG9w0BAQwFADCB\niDELMAkGA1UEBhMCVVMxEzARBgNVBAgTCk5ldyBKZXJzZXkxFDASBgNVBAcTC0pl\ncnNleSBDaXR5MR4wHAYDVQQKExVUaGUgVVNFUlRSVVNUIE5ldHdvcmsxLjAsBgNV\nBAMTJVVTRVJUcnVzdCBSU0EgQ2VydGlmaWNhdGlvbiBBdXRob3JpdHkwHhcNMTAw\nMjAxMDAwMDAwWhcNMzgwMTE4MjM1OTU5WjCBiDELMAkGA1UEBhMCVVMxEzARBgNV\nBAgTCk5ldyBKZXJzZXkxFDASBgNVBAcTC0plcnNleSBDaXR5MR4wHAYDVQQKExVU\naGUgVVNFUlRSVVNUIE5ldHdvcmsxLjAsBgNVBAMTJVVTRVJUcnVzdCBSU0EgQ2Vy\ndGlmaWNhdGlvbiBBdXRob3JpdHkwggIiMA0GCSqGSIb3DQEBAQUAA4ICDwAwggIK\nAoICAQCAEmUXNg7D2wiz0KxXDXbtzSfTTK1Qg2HiqiBNCS1kCdzOiZ/MPans9s/B\n3PHTsdZ7NygRK0faOca8Ohm0X6a9fZ2jY0K2dvKpOyuR+OJv0OwWIJAJPuLodMkY\ntJHUYmTbf6MG8YgYapAiPLz+E/CHFHv25B+O1ORRxhFnRghRy4YUVD+8M/5+bJz/\nFp0YvVGONaanZshyZ9shZrHUm3gDwFA66Mzw3LyeTP6vBZY1H1dat//O+T23LLb2\nVN3I5xI6Ta5MirdcmrS3ID3KfyI0rn47aGYBROcBTkZTmzNg95S+UzeQc0PzMsNT\n79uq/nROacdrjGCT3sTHDN/hMq7MkztReJVni+49Vv4M0GkPGw/zJSZrM233bkf6\nc0Plfg6lZrEpfDKEY1WJxA3Bk1QwGROs0303p+tdOmw1XNtB1xLaqUkL39iAigmT\nYo61Zs8liM2EuLE/pDkP2QKe6xJMlXzzawWpXhaDzLhn4ugTncxbgtNMs+1b/97l\nc6wjOy0AvzVVdAlJ2ElYGn+SNuZRkg7zJn0cTRe8yexDJtC/QV9AqURE9JnnV4ee\nUB9XVKg+/XRjL7FQZQnmWEIuQxpMtPAlR1n6BB6T1CZGSlCBst6+eLf8ZxXhyVeE\nHg9j1uliutZfVS7qXMYoCAQlObgOK6nyTJccBz8NUvXt7y+CDwIDAQABo0IwQDAd\nBgNVHQ4EFgQUU3m/WqorSs9UgOHYm8Cd8rIDZsswDgYDVR0PAQH/BAQDAgEGMA8G\nA1UdEwEB/wQFMAMBAf8wDQYJKoZIhvcNAQEMBQADggIBAFzUfA3P9wF9QZllDHPF\nUp/L+M+ZBn8b2kMVn54CVVeWFPFSPCeHlCjtHzoBN6J2/FNQwISbxmtOuowhT6KO\nVWKR82kV2LyI48SqC/3vqOlLVSoGIG1VeCkZ7l8wXEskEVX/JJpuXior7gtNn3/3\nATiUFJVDBwn7YKnuHKsSjKCaXqeYalltiz8I+8jRRa8YFWSQEg9zKC7F4iRO/Fjs\n8PRF/iKz6y+O0tlFYQXBl2+odnKPi4w2r78NBc5xjeambx9spnFixdjQg3IM8WcR\niQycE0xyNN+81XHfqnHd4blsjDwSXWXavVcStkNr/+XeTWYRUc+ZruwXtuhxkYze\nSf7dNXGiFSeUHM9h4ya7b6NnJSFd5t0dCy5oGzuCr+yDZ4XUmFF0sbmZgIn/f3gZ\nXHlKYC6SQK5MNyosycdiyA5d9zZbyuAlJQG03RoHnHcAP9Dc1ew91Pq7P8yF1m9/\nqS3fuQL39ZeatTXaw2ewh0qpKJ4jjv9cJ2vhsE/zB+4ALtRZh8tSQZXq9EfX7mRB\nVXyNWQKV3WKdwrnuWih0hKWbt5DHDAff9Yk2dDLWKMGwsAvgnEzDHNb842m1R0aB\nL6KCq9NjRHDEjf8tM7qtj3u1cIiuPhnPQCjY/MiQu12ZIvVS5ljFH4gxQ+6IHdfG\njjxDah2nGN59PRbxYvnKkKj9\n-----END CERTIFICATE-----',
    // USERTrust_crossSigned:
    '-----BEGIN CERTIFICATE-----\nMIIFgTCCBGmgAwIBAgIQOXJEOvkit1HX02wQ3TE1lTANBgkqhkiG9w0BAQwFADB7\nMQswCQYDVQQGEwJHQjEbMBkGA1UECAwSR3JlYXRlciBNYW5jaGVzdGVyMRAwDgYD\nVQQHDAdTYWxmb3JkMRowGAYDVQQKDBFDb21vZG8gQ0EgTGltaXRlZDEhMB8GA1UE\nAwwYQUFBIENlcnRpZmljYXRlIFNlcnZpY2VzMB4XDTE5MDMxMjAwMDAwMFoXDTI4\nMTIzMTIzNTk1OVowgYgxCzAJBgNVBAYTAlVTMRMwEQYDVQQIEwpOZXcgSmVyc2V5\nMRQwEgYDVQQHEwtKZXJzZXkgQ2l0eTEeMBwGA1UEChMVVGhlIFVTRVJUUlVTVCBO\nZXR3b3JrMS4wLAYDVQQDEyVVU0VSVHJ1c3QgUlNBIENlcnRpZmljYXRpb24gQXV0\naG9yaXR5MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAgBJlFzYOw9sI\ns9CsVw127c0n00ytUINh4qogTQktZAnczomfzD2p7PbPwdzx07HWezcoEStH2jnG\nvDoZtF+mvX2do2NCtnbyqTsrkfjib9DsFiCQCT7i6HTJGLSR1GJk23+jBvGIGGqQ\nIjy8/hPwhxR79uQfjtTkUcYRZ0YIUcuGFFQ/vDP+fmyc/xadGL1RjjWmp2bIcmfb\nIWax1Jt4A8BQOujM8Ny8nkz+rwWWNR9XWrf/zvk9tyy29lTdyOcSOk2uTIq3XJq0\ntyA9yn8iNK5+O2hmAUTnAU5GU5szYPeUvlM3kHND8zLDU+/bqv50TmnHa4xgk97E\nxwzf4TKuzJM7UXiVZ4vuPVb+DNBpDxsP8yUmazNt925H+nND5X4OpWaxKXwyhGNV\nicQNwZNUMBkTrNN9N6frXTpsNVzbQdcS2qlJC9/YgIoJk2KOtWbPJYjNhLixP6Q5\nD9kCnusSTJV882sFqV4Wg8y4Z+LoE53MW4LTTLPtW//e5XOsIzstAL81VXQJSdhJ\nWBp/kjbmUZIO8yZ9HE0XvMnsQybQv0FfQKlERPSZ51eHnlAfV1SoPv10Yy+xUGUJ\n5lhCLkMaTLTwJUdZ+gQek9QmRkpQgbLevni3/GcV4clXhB4PY9bpYrrWX1Uu6lzG\nKAgEJTm4Diup8kyXHAc/DVL17e8vgg8CAwEAAaOB8jCB7zAfBgNVHSMEGDAWgBSg\nEQojPpbxB+zirynvgqV/0DCktDAdBgNVHQ4EFgQUU3m/WqorSs9UgOHYm8Cd8rID\nZsswDgYDVR0PAQH/BAQDAgGGMA8GA1UdEwEB/wQFMAMBAf8wEQYDVR0gBAowCDAG\nBgRVHSAAMEMGA1UdHwQ8MDowOKA2oDSGMmh0dHA6Ly9jcmwuY29tb2RvY2EuY29t\nL0FBQUNlcnRpZmljYXRlU2VydmljZXMuY3JsMDQGCCsGAQUFBwEBBCgwJjAkBggr\nBgEFBQcwAYYYaHR0cDovL29jc3AuY29tb2RvY2EuY29tMA0GCSqGSIb3DQEBDAUA\nA4IBAQAYh1HcdCE9nIrgJ7cz0C7M7PDmy14R3iJvm3WOnnL+5Nb+qh+cli3vA0p+\nrvSNb3I8QzvAP+u431yqqcau8vzY7qN7Q/aGNnwU4M309z/+3ri0ivCRlv79Q2R+\n/czSAaF9ffgZGclCKxO/WIu6pKJmBHaIkU4MiRTOok3JMrO66BQavHHxW/BBC5gA\nCiIDEOUMsfnNkjcZ7Tvx5Dq2+UUTJnWvu6rvP3t3O9LEApE9GQDTF1w52z97GA1F\nzZOFli9d31kWTz9RvdVFGD/tSo7oBmF0Ixa1DVBzJ0RHfxBdiSprhTEUxOipakyA\nvGp4z7h/jnZymQyd/teRCBaho1+V\n-----END CERTIFICATE-----',
];

export const rootCertificates: Map<KT_CERTIFICATE_ISSUER, string[]> = new Map([
    [KT_CERTIFICATE_ISSUER.LETSENCRYPT, letsEncryptCerts],
    [KT_CERTIFICATE_ISSUER.ZEROSSL, zeroSSLCerts],
]);

/**
 * The ct log list timestamp 'log_list_timestamp' is used to determine
 * the most recent update to the hardcoded key transparency certificate data in this file.
 * If this timestamp is older than KT_DATA_VALIDITY_PERIOD, the key transparency feature is disabled.
 * See comment at the top of this file.
 */
export const ctLogs = {
    version: '32.19',
    log_list_timestamp: '2024-03-03T12:56:09Z',
    operators: [
        {
            name: 'Google',
            email: ['google-ct-logs@googlegroups.com'],
            logs: [
                {
                    description: "Google 'Argon2024' log",
                    log_id: '7s3QZNXbGs7FXLedtM0TojKHRny87N7DUUhZRnEftZs=',
                    key: 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEHblsqctplMVc5ramA7vSuNxUQxcomQwGAVAdnWTAWUYr3MgDHQW0LagJ95lB7QT75Ve6JgT2EVLOFGU7L3YrwA==',
                    url: 'https://ct.googleapis.com/logs/us1/argon2024/',
                    mmd: 86400,
                    state: { usable: { timestamp: '2022-11-01T18:54:00Z' } },
                    temporal_interval: {
                        start_inclusive: '2024-01-01T00:00:00Z',
                        end_exclusive: '2025-01-01T00:00:00Z',
                    },
                },
                {
                    description: "Google 'Argon2025h1' log",
                    log_id: 'TnWjJ1yaEMM4W2zU3z9S6x3w4I4bjWnAsfpksWKaOd8=',
                    key: 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEIIKh+WdoqOTblJji4WiH5AltIDUzODyvFKrXCBjw/Rab0/98J4LUh7dOJEY7+66+yCNSICuqRAX+VPnV8R1Fmg==',
                    url: 'https://ct.googleapis.com/logs/us1/argon2025h1/',
                    mmd: 86400,
                    state: { usable: { timestamp: '2023-11-26T12:00:00Z' } },
                    temporal_interval: {
                        start_inclusive: '2025-01-01T00:00:00Z',
                        end_exclusive: '2025-07-01T00:00:00Z',
                    },
                },
                {
                    description: "Google 'Argon2025h2' log",
                    log_id: 'EvFONL1TckyEBhnDjz96E/jntWKHiJxtMAWE6+WGJjo=',
                    key: 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEr+TzlCzfpie1/rJhgxnIITojqKk9VK+8MZoc08HjtsLzD8e5yjsdeWVhIiWCVk6Y6KomKTYeKGBv6xVu93zQug==',
                    url: 'https://ct.googleapis.com/logs/us1/argon2025h2/',
                    mmd: 86400,
                    state: { usable: { timestamp: '2023-11-26T12:00:00Z' } },
                    temporal_interval: {
                        start_inclusive: '2025-07-01T00:00:00Z',
                        end_exclusive: '2026-01-01T00:00:00Z',
                    },
                },
                {
                    description: "Google 'Xenon2024' log",
                    log_id: 'dv+IPwq2+5VRwmHM9Ye6NLSkzbsp3GhCCp/mZ0xaOnQ=',
                    key: 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEuWDgNB415GUAk0+QCb1a7ETdjA/O7RE+KllGmjG2x5n33O89zY+GwjWlPtwpurvyVOKoDIMIUQbeIW02UI44TQ==',
                    url: 'https://ct.googleapis.com/logs/eu1/xenon2024/',
                    mmd: 86400,
                    state: { usable: { timestamp: '2022-11-01T18:54:00Z' } },
                    temporal_interval: {
                        start_inclusive: '2024-01-01T00:00:00Z',
                        end_exclusive: '2025-01-01T00:00:00Z',
                    },
                },
                {
                    description: "Google 'Xenon2025h1' log",
                    log_id: 'zxFW7tUufK/zh1vZaS6b6RpxZ0qwF+ysAdJbd87MOwg=',
                    key: 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEguLOkEA/gQ7f6uEgK14uMFRGgblY7a+9/zanngtfamuRpcGY4fLN6xcgcMoqEuZUeFDc/239HKe2Oh/5JqkbvQ==',
                    url: 'https://ct.googleapis.com/logs/eu1/xenon2025h1/',
                    mmd: 86400,
                    state: { usable: { timestamp: '2023-11-26T12:00:00Z' } },
                    temporal_interval: {
                        start_inclusive: '2025-01-01T00:00:00Z',
                        end_exclusive: '2025-07-01T00:00:00Z',
                    },
                },
                {
                    description: "Google 'Xenon2025h2' log",
                    log_id: '3dzKNJXX4RYF55Uy+sef+D0cUN/bADoUEnYKLKy7yCo=',
                    key: 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEa+Cv7QZ8Pe/ZDuRYSwTYKkeZkIl6uTaldcgEuMviqiu1aJ2IKaKlz84rmhWboD6dlByyt0ryUexA7WJHpANJhg==',
                    url: 'https://ct.googleapis.com/logs/eu1/xenon2025h2/',
                    mmd: 86400,
                    state: { usable: { timestamp: '2023-11-26T12:00:00Z' } },
                    temporal_interval: {
                        start_inclusive: '2025-07-01T00:00:00Z',
                        end_exclusive: '2026-01-01T00:00:00Z',
                    },
                },
            ],
        },
        {
            name: 'Cloudflare',
            email: [
                'ct-logs@cloudflare.com',
                'mihir@cloudflare.com',
                'dkozlov@cloudflare.com',
                'leland@cloudflare.com',
            ],
            logs: [
                {
                    description: "Cloudflare 'Nimbus2024' Log",
                    log_id: '2ra/az+1tiKfm8K7XGvocJFxbLtRhIU0vaQ9MEjX+6s=',
                    key: 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEd7Gbe4/mizX+OpIpLayKjVGKJfyTttegiyk3cR0zyswz6ii5H+Ksw6ld3Ze+9p6UJd02gdHrXSnDK0TxW8oVSA==',
                    url: 'https://ct.cloudflare.com/logs/nimbus2024/',
                    mmd: 86400,
                    state: { usable: { timestamp: '2022-11-30T17:00:00Z' } },
                    temporal_interval: {
                        start_inclusive: '2024-01-01T00:00:00Z',
                        end_exclusive: '2025-01-01T00:00:00Z',
                    },
                },
                {
                    description: "Cloudflare 'Nimbus2025'",
                    log_id: 'zPsPaoVxCWX+lZtTzumyfCLphVwNl422qX5UwP5MDbA=',
                    key: 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEGoAaFRkZI3m0+qB5jo3VwdzCtZaSfpTgw34UfAoNLUaonRuxQWUMX5jEWhd5gVtKFEHsr6ldDqsSGXHNQ++7lw==',
                    url: 'https://ct.cloudflare.com/logs/nimbus2025/',
                    mmd: 86400,
                    state: { usable: { timestamp: '2023-12-19T07:00:00Z' } },
                    temporal_interval: {
                        start_inclusive: '2025-01-01T00:00:00Z',
                        end_exclusive: '2026-01-01T00:00:00Z',
                    },
                },
            ],
        },
        {
            name: 'DigiCert',
            email: ['ctops@digicert.com'],
            logs: [
                {
                    description: 'DigiCert Yeti2024 Log',
                    log_id: 'SLDja9qmRzQP5WoC+p0w6xxSActW3SyB2bu/qznYhHM=',
                    key: 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEV7jBbzCkfy7k8NDZYGITleN6405Tw7O4c4XBGA0jDliE0njvm7MeLBrewY+BGxlEWLcAd2AgGnLYgt6unrHGSw==',
                    url: 'https://yeti2024.ct.digicert.com/log/',
                    mmd: 86400,
                    state: { usable: { timestamp: '2022-11-01T18:54:00Z' } },
                    temporal_interval: {
                        start_inclusive: '2024-01-01T00:00:00Z',
                        end_exclusive: '2025-01-01T00:00:00Z',
                    },
                },
                {
                    description: 'DigiCert Yeti2025 Log',
                    log_id: 'fVkeEuF4KnscYWd8Xv340IdcFKBOlZ65Ay/ZDowuebg=',
                    key: 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE35UAXhDBAfc34xB00f+yypDtMplfDDn+odETEazRs3OTIMITPEy1elKGhj3jlSR82JGYSDvw8N8h8bCBWlklQw==',
                    url: 'https://yeti2025.ct.digicert.com/log/',
                    mmd: 86400,
                    state: { usable: { timestamp: '2022-11-01T18:54:00Z' } },
                    temporal_interval: {
                        start_inclusive: '2025-01-01T00:00:00Z',
                        end_exclusive: '2026-01-01T00:00:00Z',
                    },
                },
                {
                    description: 'DigiCert Nessie2024 Log',
                    log_id: 'c9meiRtMlnigIH1HneayxhzQUV5xGSqMa4AQesF3crU=',
                    key: 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAELfyieza/VpHp/j/oPfzDp+BhUuos6QWjnycXgQVwa4FhRIr4OxCAQu0DLwBQIfxBVISjVNUusnoWSyofK2YEKw==',
                    url: 'https://nessie2024.ct.digicert.com/log/',
                    mmd: 86400,
                    state: { retired: { timestamp: '2023-05-30T00:00:00Z' } },
                    temporal_interval: {
                        start_inclusive: '2024-01-01T00:00:00Z',
                        end_exclusive: '2025-01-01T00:00:00Z',
                    },
                },
                {
                    description: 'DigiCert Nessie2025 Log',
                    log_id: '5tIxY0B3jMEQQQbXcbnOwdJA9paEhvu6hzId/R43jlA=',
                    key: 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE8vDwp4uBLgk5O59C2jhEX7TM7Ta72EN/FklXhwR/pQE09+hoP7d4H2BmLWeadYC3U6eF1byrRwZV27XfiKFvOA==',
                    url: 'https://nessie2025.ct.digicert.com/log/',
                    mmd: 86400,
                    state: { usable: { timestamp: '2022-11-01T18:54:00Z' } },
                    temporal_interval: {
                        start_inclusive: '2025-01-01T00:00:00Z',
                        end_exclusive: '2026-01-01T00:00:00Z',
                    },
                },
            ],
        },
        {
            name: 'Sectigo',
            email: ['ctops@sectigo.com'],
            logs: [
                {
                    description: "Sectigo 'Sabre' CT log",
                    log_id: 'VYHUwhaQNgFK6gubVzxT8MDkOHhwJQgXL6OqHQcT0ww=',
                    key: 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE8m/SiQ8/xfiHHqtls9m7FyOMBg4JVZY9CgiixXGz0akvKD6DEL8S0ERmFe9U4ZiA0M4kbT5nmuk3I85Sk4bagA==',
                    url: 'https://sabre.ct.comodo.com/',
                    mmd: 86400,
                    state: { usable: { timestamp: '2017-10-10T00:38:10Z' } },
                },
                {
                    description: "Sectigo 'Sabre2024h1'",
                    log_id: 'ouK/1h7eLy8HoNZObTen3GVDsMa1LqLat4r4mm31F9g=',
                    key: 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAELAH2zjG8qhRhUf5reoeuptObx4ctClrIT7VU3MmToADuyhy5p7Z7RzvlT6psFhxwLsjsU1pMIUx+JwsTFF78hQ==',
                    url: 'https://sabre2024h1.ct.sectigo.com/',
                    mmd: 86400,
                    state: { usable: { timestamp: '2023-11-26T12:00:00Z' } },
                    temporal_interval: {
                        start_inclusive: '2024-01-01T00:00:00Z',
                        end_exclusive: '2024-07-01T00:00:00Z',
                    },
                },
                {
                    description: "Sectigo 'Sabre2024h2'",
                    log_id: 'GZgQcQnw1lIuMIDSnj9ku4NuKMz5D1KO7t/OSj8WtMo=',
                    key: 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEehBMiucie20quo76a0qB1YWuA+//S/xNUz23jLt1CcnqFn7BdxbSwkV0bY3E4Yg339TzYGX8oHXwIGaOSswZ2g==',
                    url: 'https://sabre2024h2.ct.sectigo.com/',
                    mmd: 86400,
                    state: { usable: { timestamp: '2023-11-26T12:00:00Z' } },
                    temporal_interval: {
                        start_inclusive: '2024-07-01T00:00:00Z',
                        end_exclusive: '2025-01-01T00:00:00Z',
                    },
                },
                {
                    description: "Sectigo 'Sabre2025h1'",
                    log_id: '4JKz/AwdyOdoNh/eYbmWTQpSeBmKctZyxLBNpW1vVAQ=',
                    key: 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEfi858egjjrMyBK9NV/bbxXSkem07B1EMWvuAMAXGWgzEdtYGqFdN+9/kgpDCQa5wszGi4/o9XyxdBM20nVWrQQ==',
                    url: 'https://sabre2025h1.ct.sectigo.com/',
                    mmd: 86400,
                    state: { usable: { timestamp: '2023-11-26T12:00:00Z' } },
                    temporal_interval: {
                        start_inclusive: '2025-01-01T00:00:00Z',
                        end_exclusive: '2025-07-01T00:00:00Z',
                    },
                },
                {
                    description: "Sectigo 'Sabre2025h2'",
                    log_id: 'GgT/SdBUHUCv9qDDv/HYxGcvTuzuI0BomGsXQC7ciX0=',
                    key: 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEhRMRLXvzk4HkuXzZZDvntYOZZnlZR2pCXta9Yy63kUuuvFbExW4JoNdkGsjBr4mL9VjYuut7g1Lp9OClzc2SzA==',
                    url: 'https://sabre2025h2.ct.sectigo.com/',
                    mmd: 86400,
                    state: { usable: { timestamp: '2023-11-26T12:00:00Z' } },
                    temporal_interval: {
                        start_inclusive: '2025-07-01T00:00:00Z',
                        end_exclusive: '2026-01-01T00:00:00Z',
                    },
                },
                {
                    description: "Sectigo 'Mammoth' CT log",
                    log_id: 'b1N2rDHwMRnYmQCkURX/dxUcEdkCwQApBo2yCJo32RM=',
                    key: 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE7+R9dC4VFbbpuyOL+yy14ceAmEf7QGlo/EmtYU6DRzwat43f/3swtLr/L8ugFOOt1YU/RFmMjGCL17ixv66MZw==',
                    url: 'https://mammoth.ct.comodo.com/',
                    mmd: 86400,
                    state: { retired: { timestamp: '2023-01-15T00:00:00Z' } },
                },
                {
                    description: "Sectigo 'Mammoth2024h1'",
                    log_id: 'KdA6G7Z0qnEc0wNbZVfBT4qni0/oOJRJ7KRT+US9JGg=',
                    key: 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEpFmQ83EkJPfDVSdWnKNZHve3n86rThlmTdCK+p1ipCTwOyDkHRRnyPzkN/JLOFRaz59rB5DQDn49TIey6D8HzA==',
                    url: 'https://mammoth2024h1.ct.sectigo.com/',
                    mmd: 86400,
                    state: { retired: { timestamp: '2024-01-29T00:00:00Z' } },
                    temporal_interval: {
                        start_inclusive: '2024-01-01T00:00:00Z',
                        end_exclusive: '2024-07-01T00:00:00Z',
                    },
                },
                {
                    description: "Sectigo 'Mammoth2024h1b'",
                    log_id: 'UIUBWNy2BZXADpKoEQLszf4/a3hYQp9XmDU4ydpSUGM=',
                    key: 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEo9UHKHoENK7KvoB5Tz72QfQkBOHWNloaCfLRuoQXrh6hfAAdVHOQdSGo0dpeEOGM7LKKjMjn3c3iB/BOFgJXNw==',
                    url: 'https://mammoth2024h1b.ct.sectigo.com/',
                    mmd: 86400,
                    state: { qualified: { timestamp: '2024-02-14T02:00:00Z' } },
                    temporal_interval: {
                        start_inclusive: '2024-01-01T00:00:00Z',
                        end_exclusive: '2024-07-01T00:00:00Z',
                    },
                },
                {
                    description: "Sectigo 'Mammoth2024h2'",
                    log_id: '3+FW66oFr7WcD4ZxjajAMk6uVtlup/WlagHRwTu+Ulw=',
                    key: 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEhWYiJG6+UmIKoK/DJRo2LqdgiaJlv6RfvYVqlAWBNZBUMZXnEZ6jLg+F76eIV4tjGoHBQZ197AE627nBJ/RlHg==',
                    url: 'https://mammoth2024h2.ct.sectigo.com/',
                    mmd: 86400,
                    state: { usable: { timestamp: '2023-11-26T12:00:00Z' } },
                    temporal_interval: {
                        start_inclusive: '2024-07-01T00:00:00Z',
                        end_exclusive: '2025-01-01T00:00:00Z',
                    },
                },
                {
                    description: "Sectigo 'Mammoth2025h1'",
                    log_id: 'E0rfGrWYQgl4DG/vTHqRpBa3I0nOWFdq367ap8Kr4CI=',
                    key: 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEEzxBtTB9LkqhqGvSxVdrmP5+79Uh4rpdsLqFEW6U4D2ojm1WjUQCnrCDzFTfm05yYks8DDLdhvvrPmbNd1hb5Q==',
                    url: 'https://mammoth2025h1.ct.sectigo.com/',
                    mmd: 86400,
                    state: { usable: { timestamp: '2023-11-26T12:00:00Z' } },
                    temporal_interval: {
                        start_inclusive: '2025-01-01T00:00:00Z',
                        end_exclusive: '2025-07-01T00:00:00Z',
                    },
                },
                {
                    description: "Sectigo 'Mammoth2025h2'",
                    log_id: 'rxgaKNaMo+CpikycZ6sJ+Lu8IrquvLE4o6Gd0/m2Aw0=',
                    key: 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEiOLHs9c3o5HXs8XaB1EEK4HtwkQ7daDmZeFKuhuxnKkqhDEprh2L8TOfEi6QsRVnZqB8C1tif2yaajCbaAIWbw==',
                    url: 'https://mammoth2025h2.ct.sectigo.com/',
                    mmd: 86400,
                    state: { usable: { timestamp: '2023-11-26T12:00:00Z' } },
                    temporal_interval: {
                        start_inclusive: '2025-07-01T00:00:00Z',
                        end_exclusive: '2026-01-01T00:00:00Z',
                    },
                },
            ],
        },
        {
            name: "Let's Encrypt",
            email: ['sre@letsencrypt.org'],
            logs: [
                {
                    description: "Let's Encrypt 'Oak2024H1' log",
                    log_id: 'O1N3dT4tuYBOizBbBv5AO2fYT8P0x70ADS1yb+H61Bc=',
                    key: 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEVkPXfnvUcre6qVG9NpO36bWSD+pet0Wjkv3JpTyArBog7yUvuOEg96g6LgeN5uuk4n0kY59Gv5RzUo2Wrqkm/Q==',
                    url: 'https://oak.ct.letsencrypt.org/2024h1/',
                    mmd: 86400,
                    state: { usable: { timestamp: '2022-11-30T17:00:00Z' } },
                    temporal_interval: {
                        start_inclusive: '2023-12-20T00:00:00Z',
                        end_exclusive: '2024-07-20T00:00:00Z',
                    },
                },
                {
                    description: "Let's Encrypt 'Oak2024H2' log",
                    log_id: 'PxdLT9ciR1iUHWUchL4NEu2QN38fhWrrwb8ohez4ZG4=',
                    key: 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE13PWU0fp88nVfBbC1o9wZfryUTapE4Av7fmU01qL6E8zz8PTidRfWmaJuiAfccvKu5+f81wtHqOBWa+Ss20waA==',
                    url: 'https://oak.ct.letsencrypt.org/2024h2/',
                    mmd: 86400,
                    state: { usable: { timestamp: '2022-11-30T17:00:00Z' } },
                    temporal_interval: {
                        start_inclusive: '2024-06-20T00:00:00Z',
                        end_exclusive: '2025-01-20T00:00:00Z',
                    },
                },
                {
                    description: "Let's Encrypt 'Oak2025h1'",
                    log_id: 'ouMK5EXvva2bfjjtR2d3U9eCW4SU1yteGyzEuVCkR+c=',
                    key: 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEKeBpU9ejnCaIZeX39EsdF5vDvf8ELTHdLPxikl4y4EiROIQfS4ercpnMHfh8+TxYVFs3ELGr2IP7hPGVPy4vHA==',
                    url: 'https://oak.ct.letsencrypt.org/2025h1/',
                    mmd: 86400,
                    state: { usable: { timestamp: '2023-11-26T12:00:00Z' } },
                    temporal_interval: {
                        start_inclusive: '2024-12-20T00:00:00Z',
                        end_exclusive: '2025-07-20T00:00:00Z',
                    },
                },
                {
                    description: "Let's Encrypt 'Oak2025h2'",
                    log_id: 'DeHyMCvTDcFAYhIJ6lUu/Ed0fLHX6TDvDkIetH5OqjQ=',
                    key: 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEtXYwB63GyNLkS9L1vqKNnP10+jrW+lldthxg090fY4eG40Xg1RvANWqrJ5GVydc9u8H3cYZp9LNfkAmqrr2NqQ==',
                    url: 'https://oak.ct.letsencrypt.org/2025h2/',
                    mmd: 86400,
                    state: { usable: { timestamp: '2023-11-26T12:00:00Z' } },
                    temporal_interval: {
                        start_inclusive: '2025-06-20T00:00:00Z',
                        end_exclusive: '2026-01-20T00:00:00Z',
                    },
                },
            ],
        },
        {
            name: 'TrustAsia',
            email: ['trustasia-ct-logs@trustasia.com'],
            logs: [
                {
                    description: 'Trust Asia Log2024-2',
                    log_id: 'h0+1DcAp2ZMd5XPp8omejkUzs5LTiwpGJXS/D+6y/B4=',
                    key: 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEp2TieYE/YdfsxvhlKB2gtGYzwyXVCpV4nI/+pCrYj35y4P6of/ixLYXAjhJ0DS+Mq9d/eh7ZhDM56P2JX5ZICA==',
                    url: 'https://ct2024.trustasia.com/log2024/',
                    mmd: 86400,
                    state: { usable: { timestamp: '2023-02-03T08:00:00Z' } },
                    temporal_interval: {
                        start_inclusive: '2024-01-01T00:00:00Z',
                        end_exclusive: '2025-01-01T00:00:00Z',
                    },
                },
                {
                    description: 'TrustAsia Log2025a',
                    log_id: 'KOKBOP2DIUXpqdaqdTdtg3eohRKzwH9yQUgh3L3pjGY=',
                    key: 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEcOWxpAl5K534o6DfGO+VXQNse6GRqbiAfexcAgjibi98MnC9loRfpmLpZbV8kFi6ItX59WlUt6iUTjIJriYRTQ==',
                    url: 'https://ct2025-a.trustasia.com/log2025a/',
                    mmd: 86400,
                    state: { usable: { timestamp: '2023-11-26T12:00:00Z' } },
                    temporal_interval: {
                        start_inclusive: '2025-01-01T00:00:00Z',
                        end_exclusive: '2026-01-01T00:00:00Z',
                    },
                },
                {
                    description: 'TrustAsia Log2025b',
                    log_id: 'KCyL3YEP+QkSCs4W1uDsIBvqgqOkrxnZ7/tZ6D/cQmg=',
                    key: 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEqqCL22cUXZeJHQiNBtfBlI6w+kxG1VMIeCsEU2zz3rHRU0DakFfmGp48xwO4vS+pz+h7XuFLYOU4Q2CXwVsvZQ==',
                    url: 'https://ct2025-b.trustasia.com/log2025b/',
                    mmd: 86400,
                    state: { usable: { timestamp: '2023-11-26T12:00:00Z' } },
                    temporal_interval: {
                        start_inclusive: '2025-01-01T00:00:00Z',
                        end_exclusive: '2026-01-01T00:00:00Z',
                    },
                },
            ],
        },
    ],
};
