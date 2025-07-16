import { DAY } from '@proton/shared/lib/constants';

import { KT_CERTIFICATE_ISSUER } from './constants';

/**
 * This file contains hardcoded data that becomes obsolete after KT_DATA_VALIDITY_PERIOD
 * has elapsed since the timestamp recorded in the ctLogs list. If the data expires
 * key transparency is disabled.
 * Thus, it is imperative to regularly update this data within specified intervals to ensure
 * the continuous operation of key transparency.
 */
export const KT_DATA_VALIDITY_PERIOD = 365 * DAY;

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
export const ctLogs ={
  version: '59.1',
  log_list_timestamp: '2025-07-10T12:53:11Z',
  operators: [
    {
      name: 'Google',
      email: [ 'google-ct-logs@googlegroups.com' ],
      logs: [
        {
          description: "Google 'Argon2025h1' log",
          log_id: 'TnWjJ1yaEMM4W2zU3z9S6x3w4I4bjWnAsfpksWKaOd8=',
          key: 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEIIKh+WdoqOTblJji4WiH5AltIDUzODyvFKrXCBjw/Rab0/98J4LUh7dOJEY7+66+yCNSICuqRAX+VPnV8R1Fmg==',
          url: 'https://ct.googleapis.com/logs/us1/argon2025h1/',
          mmd: 86400,
          state: { usable: { timestamp: '2023-11-26T12:00:00Z' } },
          temporal_interval: {
            start_inclusive: '2025-01-01T00:00:00Z',
            end_exclusive: '2025-07-01T00:00:00Z'
          }
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
            end_exclusive: '2026-01-01T00:00:00Z'
          }
        },
        {
          description: "Google 'Argon2026h1' log",
          log_id: 'DleUvPOuqT4zGyyZB7P3kN+bwj1xMiXdIaklrGHFTiE=',
          key: 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEB/we6GOO/xwxivy4HhkrYFAAPo6e2nc346Wo2o2U+GvoPWSPJz91s/xrEvA3Bk9kWHUUXVZS5morFEzsgdHqPg==',
          url: 'https://ct.googleapis.com/logs/us1/argon2026h1/',
          mmd: 86400,
          state: { usable: { timestamp: '2024-09-30T22:19:27Z' } },
          temporal_interval: {
            start_inclusive: '2026-01-01T00:00:00Z',
            end_exclusive: '2026-07-01T00:00:00Z'
          }
        },
        {
          description: "Google 'Argon2026h2' log",
          log_id: '1219ENGn9XfCx+lf1wC/+YLJM1pl4dCzAXMXwMjFaXc=',
          key: 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEKjpni/66DIYrSlGK6Rf+e6F2c/28ZUvDJ79N81+gyimAESAyeNZ++TRgjHWg9TVQnKHTSU0T1TtqDupFnSQTIg==',
          url: 'https://ct.googleapis.com/logs/us1/argon2026h2/',
          mmd: 86400,
          state: { usable: { timestamp: '2024-09-30T22:19:27Z' } },
          temporal_interval: {
            start_inclusive: '2026-07-01T00:00:00Z',
            end_exclusive: '2027-01-01T00:00:00Z'
          }
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
            end_exclusive: '2025-07-01T00:00:00Z'
          }
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
            end_exclusive: '2026-01-01T00:00:00Z'
          }
        },
        {
          description: "Google 'Xenon2026h1' log",
          log_id: 'lpdkv1VYl633Q4doNwhCd+nwOtX2pPM2bkakPw/KqcY=',
          key: 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEOh/Iu87VkEc0ysoBBCchHOIpPZK7kUXHWj6l1PIS5ujmQ7rze8I4r/wjigVW6wMKMMxjbNk8vvV7lLqU07+ITA==',
          url: 'https://ct.googleapis.com/logs/eu1/xenon2026h1/',
          mmd: 86400,
          state: { usable: { timestamp: '2024-09-30T22:19:27Z' } },
          temporal_interval: {
            start_inclusive: '2026-01-01T00:00:00Z',
            end_exclusive: '2026-07-01T00:00:00Z'
          }
        },
        {
          description: "Google 'Xenon2026h2' log",
          log_id: '2AlVO5RPev/IFhlvlE+Fq7D4/F6HVSYPFdEucrtFSxQ=',
          key: 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE5Xd4lXEos5XJpcx6TOgyA5Z7/C4duaTbQ6C9aXL5Rbqaw+mW1XDnDX7JlRUninIwZYZDU9wRRBhJmCVopzwFvw==',
          url: 'https://ct.googleapis.com/logs/eu1/xenon2026h2/',
          mmd: 86400,
          state: { usable: { timestamp: '2024-09-30T22:19:27Z' } },
          temporal_interval: {
            start_inclusive: '2026-07-01T00:00:00Z',
            end_exclusive: '2027-01-01T00:00:00Z'
          }
        }
      ],
      tiled_logs: []
    },
    {
      name: 'Cloudflare',
      email: [
        'ct-logs@cloudflare.com',
        'mihir@cloudflare.com',
        'dkozlov@cloudflare.com',
        'leland@cloudflare.com'
      ],
      logs: [
        {
          description: "Cloudflare 'Nimbus2025'",
          log_id: 'zPsPaoVxCWX+lZtTzumyfCLphVwNl422qX5UwP5MDbA=',
          key: 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEGoAaFRkZI3m0+qB5jo3VwdzCtZaSfpTgw34UfAoNLUaonRuxQWUMX5jEWhd5gVtKFEHsr6ldDqsSGXHNQ++7lw==',
          url: 'https://ct.cloudflare.com/logs/nimbus2025/',
          mmd: 86400,
          state: { usable: { timestamp: '2023-12-19T07:00:00Z' } },
          temporal_interval: {
            start_inclusive: '2025-01-01T00:00:00Z',
            end_exclusive: '2026-01-01T00:00:00Z'
          }
        },
        {
          description: "Cloudflare 'Nimbus2026'",
          log_id: 'yzj3FYl8hKFEX1vB3fvJbvKaWc1HCmkFhbDLFMMUWOc=',
          key: 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE2FxhT6xq0iCATopC9gStS9SxHHmOKTLeaVNZ661488Aq8tARXQV+6+jB0983v5FkRm4OJxPqu29GJ1iG70Ahow==',
          url: 'https://ct.cloudflare.com/logs/nimbus2026/',
          mmd: 86400,
          state: { usable: { timestamp: '2024-11-08T18:00:00Z' } },
          temporal_interval: {
            start_inclusive: '2026-01-01T00:00:00Z',
            end_exclusive: '2027-01-01T00:00:00Z'
          }
        }
      ],
      tiled_logs: []
    },
    {
      name: 'DigiCert',
      email: [ 'ctops@digicert.com' ],
      logs: [
        {
          description: 'DigiCert Yeti2025 Log',
          log_id: 'fVkeEuF4KnscYWd8Xv340IdcFKBOlZ65Ay/ZDowuebg=',
          key: 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE35UAXhDBAfc34xB00f+yypDtMplfDDn+odETEazRs3OTIMITPEy1elKGhj3jlSR82JGYSDvw8N8h8bCBWlklQw==',
          url: 'https://yeti2025.ct.digicert.com/log/',
          mmd: 86400,
          state: { retired: { timestamp: '2025-07-24T00:00:00Z' } },
          temporal_interval: {
            start_inclusive: '2025-01-01T00:00:00Z',
            end_exclusive: '2026-01-01T00:00:00Z'
          }
        },
        {
          description: 'DigiCert Nessie2025 Log',
          log_id: '5tIxY0B3jMEQQQbXcbnOwdJA9paEhvu6hzId/R43jlA=',
          key: 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE8vDwp4uBLgk5O59C2jhEX7TM7Ta72EN/FklXhwR/pQE09+hoP7d4H2BmLWeadYC3U6eF1byrRwZV27XfiKFvOA==',
          url: 'https://nessie2025.ct.digicert.com/log/',
          mmd: 86400,
          state: { retired: { timestamp: '2025-04-15T23:00:00Z' } },
          temporal_interval: {
            start_inclusive: '2025-01-01T00:00:00Z',
            end_exclusive: '2026-01-01T00:00:00Z'
          }
        },
        {
          description: "DigiCert 'Wyvern2025h1' Log",
          log_id: 'cyAiDwgWivnzxKaLCrJqmkoA7vV3hYoITQUA1KVCRFk=',
          key: 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEp8uAYYYbH7WrKyB2WYNmDs6uuG87iALrQ/SHkMuL2qwOGVDg+SQOqyaTjD+eDZZYRJ07ioDFyL7hiUZrSEzWCQ==',
          url: 'https://wyvern.ct.digicert.com/2025h1/',
          mmd: 86400,
          state: { retired: { timestamp: '2025-04-14T22:33:20Z' } },
          temporal_interval: {
            start_inclusive: '2025-01-01T00:00:00Z',
            end_exclusive: '2025-07-07T00:00:00Z'
          }
        },
        {
          description: "DigiCert 'Wyvern2025h2' Log",
          log_id: '7TxL1ugGwqSiAFfbyyTiOAHfUS/txIbFcA8g3bc+P+A=',
          key: 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE4NtB7+QEvctrLkzM8WzeQVh//pT2evZg7Yt2cqOiHDETMjWh8gjSaMU0p1YIHGPeleKBaZeNHqi3ZlEldU14Lg==',
          url: 'https://wyvern.ct.digicert.com/2025h2/',
          mmd: 86400,
          state: { usable: { timestamp: '2024-08-29T03:09:43Z' } },
          temporal_interval: {
            start_inclusive: '2025-07-01T00:00:00Z',
            end_exclusive: '2026-01-07T00:00:00Z'
          }
        },
        {
          description: "DigiCert 'Wyvern2026h1'",
          log_id: 'ZBHEbKQS7KeJHKICLgC8q08oB9QeNSer6v7VA8l9zfA=',
          key: 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE7Lw0OeKajbeZepHxBXJS2pOJXToHi5ntgKUW2nMhIOuGlofFxtkXum65TBNY1dGD+HrfHge8Fc3ASs0qMXEHVQ==',
          url: 'https://wyvern.ct.digicert.com/2026h1/',
          mmd: 86400,
          state: { usable: { timestamp: '2024-11-08T00:00:00Z' } },
          temporal_interval: {
            start_inclusive: '2026-01-01T00:00:00Z',
            end_exclusive: '2026-07-01T00:00:00Z'
          }
        },
        {
          description: "DigiCert 'Wyvern2026h2'",
          log_id: 'wjF+V0UZo0XufzjespBB68fCIVoiv3/Vta12mtkOUs0=',
          key: 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEenPbSvLeT+zhFBu+pqk8IbhFEs16iCaRIFb1STLDdWzL6XwTdTWcbOzxMTzB3puME5K3rT0PoZyPSM50JxgjmQ==',
          url: 'https://wyvern.ct.digicert.com/2026h2/',
          mmd: 86400,
          state: { usable: { timestamp: '2024-11-08T00:00:00Z' } },
          temporal_interval: {
            start_inclusive: '2026-07-01T00:00:00Z',
            end_exclusive: '2027-01-01T00:00:00Z'
          }
        },
        {
          description: "DigiCert 'Sphinx2025h1' Log",
          log_id: '3oWB11AkfGvNy69WN8XngcZM5G7WF2OfjzSnJsnivTc=',
          key: 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE4y8fTYkFdSl4uyI9B2JRFHCU5zzq9e6upkiahlJOnlzjlZcou1JLKv3IyYlORTEX043y584YEViYLGBvWCA2bg==',
          url: 'https://sphinx.ct.digicert.com/2025h1/',
          mmd: 86400,
          state: { retired: { timestamp: '2025-04-14T22:33:20Z' } },
          temporal_interval: {
            start_inclusive: '2025-01-01T00:00:00Z',
            end_exclusive: '2025-07-07T00:00:00Z'
          }
        },
        {
          description: "DigiCert 'Sphinx2025h2' Log",
          log_id: 'pELFBklgYVSPD9TqnPt6LSZFTYepfy/fRVn2J086hFQ=',
          key: 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEQYxQE1SxGQW3f0ogbqN1Y8o09Mx06jI7tosDFKhSfzKHXlmeD6sYnilstXJ3GidUhV3BeySoNOPNiM7UUBu+aQ==',
          url: 'https://sphinx.ct.digicert.com/2025h2/',
          mmd: 86400,
          state: { usable: { timestamp: '2024-08-29T03:09:43Z' } },
          temporal_interval: {
            start_inclusive: '2025-07-01T00:00:00Z',
            end_exclusive: '2026-01-07T00:00:00Z'
          }
        },
        {
          description: "DigiCert 'Sphinx2026h1'",
          log_id: 'SZybad4dfOz8Nt7Nh2SmuFuvCoeAGdFVUvvp6ynd+MM=',
          key: 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEq4S++DyHokIlmmacritS51r5IRsZA6UH4kYLH4pefGyu/xl3huh7/O5rNk/yvMOeBQKaCAG1SSM1xNNQK1Hp9A==',
          url: 'https://sphinx.ct.digicert.com/2026h1/',
          mmd: 86400,
          state: { usable: { timestamp: '2024-11-08T00:00:00Z' } },
          temporal_interval: {
            start_inclusive: '2026-01-01T00:00:00Z',
            end_exclusive: '2026-07-01T00:00:00Z'
          }
        },
        {
          description: "DigiCert 'Sphinx2026h2'",
          log_id: 'lE5Dh/rswe+B8xkkJqgYZQHH0184AgE/cmd9VTcuGdg=',
          key: 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEquD0JkRQT/2inuaA4HC1sc6UpfiXgURVQmQcInmnZFnTiZMhZvsJgWAfYlU0OIykOC6slQzr7U9kvEVC9wZ6zQ==',
          url: 'https://sphinx.ct.digicert.com/2026h2/',
          mmd: 86400,
          state: { usable: { timestamp: '2024-11-08T00:00:00Z' } },
          temporal_interval: {
            start_inclusive: '2026-07-01T00:00:00Z',
            end_exclusive: '2027-01-01T00:00:00Z'
          }
        }
      ],
      tiled_logs: []
    },
    {
      name: 'Sectigo',
      email: [ 'ctops@sectigo.com' ],
      logs: [
        {
          description: "Sectigo 'Sabre2025h1'",
          log_id: '4JKz/AwdyOdoNh/eYbmWTQpSeBmKctZyxLBNpW1vVAQ=',
          key: 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEfi858egjjrMyBK9NV/bbxXSkem07B1EMWvuAMAXGWgzEdtYGqFdN+9/kgpDCQa5wszGi4/o9XyxdBM20nVWrQQ==',
          url: 'https://sabre2025h1.ct.sectigo.com/',
          mmd: 86400,
          state: { usable: { timestamp: '2023-11-26T12:00:00Z' } },
          temporal_interval: {
            start_inclusive: '2025-01-01T00:00:00Z',
            end_exclusive: '2025-07-01T00:00:00Z'
          }
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
            end_exclusive: '2026-01-01T00:00:00Z'
          }
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
            end_exclusive: '2025-07-01T00:00:00Z'
          }
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
            end_exclusive: '2026-01-01T00:00:00Z'
          }
        },
        {
          description: "Sectigo 'Mammoth2026h1'",
          log_id: 'JS+Uwisp6W6fQRpyBytpXFtS/5epDSVAu/zcUexN7gs=',
          key: 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEnssMilHMiuILzoXmr00x2xtqTP2weWuZl8Bd+25FUB1iqsafm2sFPaKrK12Im1Ao4p5YpaX6+eP6FSXjFBMyxA==',
          url: 'https://mammoth2026h1.ct.sectigo.com/',
          mmd: 86400,
          state: { usable: { timestamp: '2024-10-14T17:00:00Z' } },
          temporal_interval: {
            start_inclusive: '2026-01-01T00:00:00Z',
            end_exclusive: '2026-07-01T00:00:00Z'
          }
        },
        {
          description: "Sectigo 'Mammoth2026h2'",
          log_id: 'lLHBirDQV8R74KwEDh8svI3DdXJ7yVHyClJhJoY7pzw=',
          key: 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE7INh8te0u+TkO+vIY3WYz2GQYxQ9XyLfdLpQp1ibaX3mY4lt2ddRhD/4AtjI/8KXceV+J/VysY8kJ1cKDXTAtg==',
          url: 'https://mammoth2026h2.ct.sectigo.com/',
          mmd: 86400,
          state: { usable: { timestamp: '2024-10-14T17:00:00Z' } },
          temporal_interval: {
            start_inclusive: '2026-07-01T00:00:00Z',
            end_exclusive: '2027-01-01T00:00:00Z'
          }
        },
        {
          description: "Sectigo 'Sabre2026h1'",
          log_id: 'VmzVo3a+g9/jQrZ1xJwjJJinabrDgsurSaOHfZqzLQE=',
          key: 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEhCa8Nr3YjTyHnuAQr82U2de5UYA0fvdYXHPq6wmTuBB7kJx9x82WQ+1TbpUhRmdR8N62yZ6q4oBtziWBNNdqYA==',
          url: 'https://sabre2026h1.ct.sectigo.com/',
          mmd: 86400,
          state: { usable: { timestamp: '2024-10-14T17:00:00Z' } },
          temporal_interval: {
            start_inclusive: '2026-01-01T00:00:00Z',
            end_exclusive: '2026-07-01T00:00:00Z'
          }
        },
        {
          description: "Sectigo 'Sabre2026h2'",
          log_id: 'H1bRq5RwSkHdP+r99GmTVTAsFDG/5hNGCJ//rnldzC8=',
          key: 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEzjXK7DkHgtp3J4bk8n7F3Djym6mrjKfA7YMePmobwPCVVroyM0x1fAkH6eE+ZTVj8Em+ctGqna99CMS0jVk9cw==',
          url: 'https://sabre2026h2.ct.sectigo.com/',
          mmd: 86400,
          state: { usable: { timestamp: '2024-10-14T17:00:00Z' } },
          temporal_interval: {
            start_inclusive: '2026-07-01T00:00:00Z',
            end_exclusive: '2027-01-01T00:00:00Z'
          }
        },
        {
          description: "Sectigo 'Elephant2025h2'",
          log_id: 'DR28iUTp9QBVQtctPhRMzEMIKrbqHpTf1wZlfS6G8wE=',
          key: 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE0OlLeGW2qUZGUoQERydw3GlayEO3ZK3418zThY1tDYr85ASme6ZOL/2DXyOXw8RCwVsKhRbOqMEOxW4Q2p4KQg==',
          url: 'https://elephant2025h2.ct.sectigo.com/',
          mmd: 86400,
          state: { qualified: { timestamp: '2025-05-13T01:33:20Z' } },
          temporal_interval: {
            start_inclusive: '2025-07-01T00:00:00Z',
            end_exclusive: '2026-01-01T00:00:00Z'
          }
        },
        {
          description: "Sectigo 'Elephant2026h1'",
          log_id: '0W6ppWgHfmY1oD83pd28A6U8QRIU1IgY9ekxsyPLlQQ=',
          key: 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEU0lqnPHoXuU9Fc9dJv1HQZCvssJfvxLsirwVQ/fkFyUqeu4inwPKikeT4DGyyWWH4NR/DCJa2bAumHrXJdAcaQ==',
          url: 'https://elephant2026h1.ct.sectigo.com/',
          mmd: 86400,
          state: { qualified: { timestamp: '2025-05-13T01:33:20Z' } },
          temporal_interval: {
            start_inclusive: '2026-01-01T00:00:00Z',
            end_exclusive: '2026-07-01T00:00:00Z'
          }
        },
        {
          description: "Sectigo 'Elephant2026h2'",
          log_id: 'r2eIO1ewTt2Pptl+9i6o64EKx3Fg8CReVdYML+eFhzo=',
          key: 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEO/t4Uwkoou78zkCchh9tfAKbIUJmbOoUAb8szD8StnnHFKAVY5kq1Ljs8YD7CfzdD7xcVjmQYpbtNUhxRMRtmA==',
          url: 'https://elephant2026h2.ct.sectigo.com/',
          mmd: 86400,
          state: { qualified: { timestamp: '2025-05-13T01:33:20Z' } },
          temporal_interval: {
            start_inclusive: '2026-07-01T00:00:00Z',
            end_exclusive: '2027-01-01T00:00:00Z'
          }
        },
        {
          description: "Sectigo 'Elephant2027h1'",
          log_id: 'YEyar3p/d18B1Ab8kg3ImesLHH34yVIb+voXdzuXi8k=',
          key: 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE4fu36JygUwaaVO+ddWJ97FJZlA5SjPLmT+RHwg0pavkIrbT1b5LNQrsaEw0CoGraf7BkzKZf7PC8gYAScw2woA==',
          url: 'https://elephant2027h1.ct.sectigo.com/',
          mmd: 86400,
          state: { qualified: { timestamp: '2025-05-13T01:33:20Z' } },
          temporal_interval: {
            start_inclusive: '2027-01-01T00:00:00Z',
            end_exclusive: '2027-07-01T00:00:00Z'
          }
        },
        {
          description: "Sectigo 'Elephant2027h2'",
          log_id: 'okkM3NuOM6QAMhdg1tTVGiA2GR6nfZaL4mqKAPb///c=',
          key: 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAECTPhpJnRFroRRpP/1DdAns+PrnmUywtqIV+EeL4Jg8zKouoW7kuAkYo+kZeoHtyK7CBhflIlMk7T2Qrn4w/t8g==',
          url: 'https://elephant2027h2.ct.sectigo.com/',
          mmd: 86400,
          state: { qualified: { timestamp: '2025-05-13T01:33:20Z' } },
          temporal_interval: {
            start_inclusive: '2027-07-01T00:00:00Z',
            end_exclusive: '2028-01-01T00:00:00Z'
          }
        },
        {
          description: "Sectigo 'Tiger2025h2'",
          log_id: 'XKV30pt/i69Bntjsq/tty67DhTcC1XRvF02tPJNKqWo=',
          key: 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEFUl5keBbWVckXMv6WSWToTeGwi9DSNCI2WZlIENBkA/zADmmS58w33/f0JhC2KEkWS+4T7/bYOXv4dDNzzrExg==',
          url: 'https://tiger2025h2.ct.sectigo.com/',
          mmd: 86400,
          state: { qualified: { timestamp: '2025-07-09T13:00:00Z' } },
          temporal_interval: {
            start_inclusive: '2025-07-01T00:00:00Z',
            end_exclusive: '2026-01-01T00:00:00Z'
          }
        },
        {
          description: "Sectigo 'Tiger2026h1'",
          log_id: 'FoMtq/CpJQ8P8DqlRf/Iv8gj0IdL9gQpJ/jnHzMT9fo=',
          key: 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE73eDJyszDbzsWcgI0nbtU0+y11gQWjNjS/RSO5P4hOSFE+pPrDCtfNPHe6dq7/XQYwOFt9Feb8TwQW+mqXN5xg==',
          url: 'https://tiger2026h1.ct.sectigo.com/',
          mmd: 86400,
          state: { qualified: { timestamp: '2025-07-09T13:00:00Z' } },
          temporal_interval: {
            start_inclusive: '2026-01-01T00:00:00Z',
            end_exclusive: '2026-07-01T00:00:00Z'
          }
        },
        {
          description: "Sectigo 'Tiger2026h2'",
          log_id: 'yKPEf8ezrbk1awE/anoSbeM6TkOlxkb5l605dZkdz5o=',
          key: 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEfJFUD/FRkonvZIA9ZT1J3yvA4EpSp3innbIVpMTDR1oCe5vguapheQ7wYiWaCES1EL1B+2BEC+P5bUfwF44lnA==',
          url: 'https://tiger2026h2.ct.sectigo.com/',
          mmd: 86400,
          state: { qualified: { timestamp: '2025-07-09T13:00:00Z' } },
          temporal_interval: {
            start_inclusive: '2026-07-01T00:00:00Z',
            end_exclusive: '2027-01-01T00:00:00Z'
          }
        },
        {
          description: "Sectigo 'Tiger2027h1'",
          log_id: 'HJ9oLOn68EVpUPgbloqH3dsyENhM5siy44JSSsTPWZ8=',
          key: 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEmMQofpsDjCVYzF4jXdFWM/ioYBJIPcsQQrNAHE6v4lOsADoI+/jN1lph8x4K3NgnXDXwmyJcFwRYgVOBMhaYhA==',
          url: 'https://tiger2027h1.ct.sectigo.com/',
          mmd: 86400,
          state: { qualified: { timestamp: '2025-07-09T13:00:00Z' } },
          temporal_interval: {
            start_inclusive: '2027-01-01T00:00:00Z',
            end_exclusive: '2027-07-01T00:00:00Z'
          }
        },
        {
          description: "Sectigo 'Tiger2027h2'",
          log_id: 'A4AqwmL24F4D+Lxve5hRMk/Xaj31t1lRdeIi+46b1fY=',
          key: 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEb0AgkemhsPmYe1goCSy5ncf2lG9vtK6f+SzODKJMYEgPOT+z93cUEKM1EaTuo09rozfdqhjeihIl25y9A3JhyQ==',
          url: 'https://tiger2027h2.ct.sectigo.com/',
          mmd: 86400,
          state: { qualified: { timestamp: '2025-07-09T13:00:00Z' } },
          temporal_interval: {
            start_inclusive: '2027-07-01T00:00:00Z',
            end_exclusive: '2028-01-01T00:00:00Z'
          }
        }
      ],
      tiled_logs: []
    },
    {
      name: "Let's Encrypt",
      email: [ 'sre@letsencrypt.org' ],
      logs: [
        {
          description: "Let's Encrypt 'Oak2025h1'",
          log_id: 'ouMK5EXvva2bfjjtR2d3U9eCW4SU1yteGyzEuVCkR+c=',
          key: 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEKeBpU9ejnCaIZeX39EsdF5vDvf8ELTHdLPxikl4y4EiROIQfS4ercpnMHfh8+TxYVFs3ELGr2IP7hPGVPy4vHA==',
          url: 'https://oak.ct.letsencrypt.org/2025h1/',
          mmd: 86400,
          state: { usable: { timestamp: '2023-11-26T12:00:00Z' } },
          temporal_interval: {
            start_inclusive: '2024-12-20T00:00:00Z',
            end_exclusive: '2025-07-20T00:00:00Z'
          }
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
            end_exclusive: '2026-01-20T00:00:00Z'
          }
        },
        {
          description: "Let's Encrypt 'Oak2026h1'",
          log_id: 'GYbUxyiqb/66A294Kk0BkarOLXIxD67OXXBBLSVMx9Q=',
          key: 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEmdRhcCL6d5MNs8eAliJRvyV5sQFC6UF7iwzHsmVaifT64gJG1IrHzBAHESdFSJAjQN56TYky+9cK616MovH2SQ==',
          url: 'https://oak.ct.letsencrypt.org/2026h1/',
          mmd: 86400,
          state: { usable: { timestamp: '2024-11-04T00:00:00Z' } },
          temporal_interval: {
            start_inclusive: '2025-12-20T00:00:00Z',
            end_exclusive: '2026-07-20T00:00:00Z'
          }
        },
        {
          description: "Let's Encrypt 'Oak2026h2'",
          log_id: 'rKswcGzr7IQx9BPS9JFfER5CJEOx8qaMTzwrO6ceAsM=',
          key: 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEanCds5bj7IU2lcNPnIvZfMnVkSmu69aH3AS8O/Y0D/bbCPdSqYjvuz9Z1tT29PxcqYxf+w1g5CwPFuwqsm3rFQ==',
          url: 'https://oak.ct.letsencrypt.org/2026h2/',
          mmd: 86400,
          state: { usable: { timestamp: '2024-11-04T00:00:00Z' } },
          temporal_interval: {
            start_inclusive: '2026-06-20T00:00:00Z',
            end_exclusive: '2027-01-20T00:00:00Z'
          }
        }
      ],
      tiled_logs: []
    },
    {
      name: 'TrustAsia',
      email: [ 'trustasia-ct-logs@trustasia.com' ],
      logs: [
        {
          description: 'TrustAsia Log2025a',
          log_id: 'KOKBOP2DIUXpqdaqdTdtg3eohRKzwH9yQUgh3L3pjGY=',
          key: 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEcOWxpAl5K534o6DfGO+VXQNse6GRqbiAfexcAgjibi98MnC9loRfpmLpZbV8kFi6ItX59WlUt6iUTjIJriYRTQ==',
          url: 'https://ct2025-a.trustasia.com/log2025a/',
          mmd: 86400,
          state: { usable: { timestamp: '2023-11-26T12:00:00Z' } },
          temporal_interval: {
            start_inclusive: '2025-01-01T00:00:00Z',
            end_exclusive: '2026-01-01T00:00:00Z'
          }
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
            end_exclusive: '2026-01-01T00:00:00Z'
          }
        },
        {
          description: "TrustAsia 'log2026a'",
          log_id: 'dNudWPfUfp39eHoWKpkcGM9pjafHKZGMmhiwRQ26RLw=',
          key: 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEp056yaYH+f907JjLSeEAJLNZLoP9wHA1M0xjynSDwDxbU0B8MR81pF8P5O5PiRfoWy7FrAAFyXY3RZcDFf9gWQ==',
          url: 'https://ct2026-a.trustasia.com/log2026a/',
          mmd: 86400,
          state: { usable: { timestamp: '2024-09-20T00:00:00Z' } },
          temporal_interval: {
            start_inclusive: '2025-12-24T00:00:00Z',
            end_exclusive: '2027-01-08T00:00:00Z'
          }
        },
        {
          description: "TrustAsia 'log2026b'",
          log_id: 'Jbfv3qETAZPtkweXcKoyKiZiDeNayKp8dRl94LGp4GU=',
          key: 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEDxKMqebj7GLu31jIUOYmcHYQtwQ5s6f4THM7wzhaEgBM4NoOFopFMgoxqiLHnX0FU8eelOqbV0a/T6R++9/6hQ==',
          url: 'https://ct2026-b.trustasia.com/log2026b/',
          mmd: 86400,
          state: { usable: { timestamp: '2024-09-20T00:00:00Z' } },
          temporal_interval: {
            start_inclusive: '2025-12-24T00:00:00Z',
            end_exclusive: '2027-01-08T00:00:00Z'
          }
        }
      ],
      tiled_logs: []
    },
    {
      name: 'Geomys',
      email: [ 'ct@geomys.org' ],
      logs: [
        {
          description: 'Bogus placeholder log to unbreak misbehaving CT libraries',
          log_id: 'LtakTeuPDIZGZ3acTt0EH4QjZ1X6OqymNNCTXfzVmnA=',
          key: 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEj4lCAxWCY6SzIthkqZhwiUVzcK62i6Fc+/YS0WHaN6jjO1ITUFuu8beOiU9PdeNmdalZcC3iWovAfApvXS33Nw==',
          url: 'https://ct.example.com/bogus/',
          mmd: 86400,
          state: { retired: { timestamp: '2025-06-21T07:00:00Z' } },
          temporal_interval: {
            start_inclusive: '2020-01-01T08:00:00Z',
            end_exclusive: '2020-01-02T08:00:00Z'
          }
        }
      ],
      tiled_logs: [
        {
          description: "Geomys 'Tuscolo2025h2'",
          log_id: '750EQi4gtDIQJ1TfUtJRRgJ/hEwH/YZeySLub86fe7w=',
          key: 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEK9d4GGtzbkwwsYpEtvnU9KKgZr67MsGlB7mnF8DW9bHnngHzPzXPbdo7n+FyCwSDYqEHbal1Z0CCVyZD6wQ/ow==',
          submission_url: 'https://tuscolo2025h2.sunlight.geomys.org/',
          monitoring_url: 'https://tuscolo2025h2.skylight.geomys.org/',
          mmd: 60,
          state: { qualified: { timestamp: '2025-06-13T02:40:00Z' } },
          temporal_interval: {
            start_inclusive: '2025-07-01T00:00:00Z',
            end_exclusive: '2026-01-01T00:00:00Z'
          }
        },
        {
          description: "Geomys 'Tuscolo2026h1'",
          log_id: 'cX6V88I4im2x44RJPTHhWqliCHYtQgDgBQzQZ7WmYeI=',
          key: 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEflxzMg2Ajjg7h1+ZIvQ9LV6yFvdj6uRi9YbvtRnSCgS2SamkH56WcPRaBTRYARPDIr5JwLqgJAVA/NvDxdJXOw==',
          submission_url: 'https://tuscolo2026h1.sunlight.geomys.org/',
          monitoring_url: 'https://tuscolo2026h1.skylight.geomys.org/',
          mmd: 60,
          state: { qualified: { timestamp: '2025-06-13T02:40:00Z' } },
          temporal_interval: {
            start_inclusive: '2026-01-01T00:00:00Z',
            end_exclusive: '2026-07-01T00:00:00Z'
          }
        },
        {
          description: "Geomys 'Tuscolo2026h2'",
          log_id: 'Rq+GPTs+5Z+ld96oJF02sNntIqIj9GF3QSKUUu6VUF8=',
          key: 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEaA6P0i7JTsd9XfzF1/76avRWA3XXI4NStsFO/aFtBp6SY7olDEMiPSFSxGzFQjKA1r9vgG/oFQwurlWMy9FQNw==',
          submission_url: 'https://tuscolo2026h2.sunlight.geomys.org/',
          monitoring_url: 'https://tuscolo2026h2.skylight.geomys.org/',
          mmd: 60,
          state: { qualified: { timestamp: '2025-06-13T02:40:00Z' } },
          temporal_interval: {
            start_inclusive: '2026-07-01T00:00:00Z',
            end_exclusive: '2027-01-01T00:00:00Z'
          }
        }
      ]
    }
  ]
};
