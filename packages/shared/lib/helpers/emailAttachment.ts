import { languageCode, localeCode } from '@proton/shared/lib/i18n';

const FR_REGEX =
    /voir pi\u00e8ce jointe|voir pi\u00e8ces jointes|voir fichier joint|voir fichiers joints|voir fichier associ\u00e9|voir fichiers associ\u00e9s|joint|joints|jointe|jointes|joint \u00e0 cet e-mail|jointe \u00e0 cet e-mail|joints \u00e0 cet e-mail|jointes \u00e0 cet e-mail|joint \u00e0 ce message|jointe \u00e0 ce message|joints \u00e0 ce message|jointes \u00e0 ce message|je joins|j'ai joint|ci-joint|pi\u00e8ce jointe|pi\u00e8ces jointes|fichier joint|fichiers joints|voir le fichier joint|voir les fichiers joints|voir la pi\u00e8ce jointe|voir les pi\u00e8ces jointes/gi;
const EN_REGEX =
    /see attached|see attachment|see included|is attached|attached is|are attached|attached are|attached to this email|attached to this message|I'm attaching|I am attaching|I've attached|I have attached|I attach|I attached|find attached|find the attached|find included|find the included|attached file|see the attached|see attachments|attached files|see the attachment|here is the attachment|attached you will find/gi;
const DE_REGEX =
    /siehe Anhang|angeh\u00e4ngt|anbei|hinzugef\u00fcgt|ist angeh\u00e4ngt|angeh\u00e4ngt ist|sind angeh\u00e4ngt|angeh\u00e4ngt sind|an diese E-Mail angeh\u00e4ngt|an diese Nachricht angeh\u00e4ngt|Anhang hinzuf\u00fcgen|Anhang anbei|Anhang hinzugef\u00fcgt|anbei finden|anbei|im Anhang|mit dieser E-Mail sende ich|angeh\u00e4ngte Datei|siehe angeh\u00e4ngte Datei|siehe Anh\u00e4nge|angeh\u00e4ngte Dateien|siehe Anlage|siehe Anlagen/gi;
const ES_REGEX =
    /ver adjunto|ver archivo adjunto|ver archivo incluido|se ha adjuntado|adjuntado|se han adjuntado|adjuntados|se ha adjuntado a este correo|se ha adjuntado a este mensaje|Adjunto te env\u00edo|He adjuntado|He adjuntado un archivo|adjunto|adjunto el archivo|incluyo el archivo|archivo adjunto|mira el archivo adjunto|ver archivos adjuntos|archivos adjuntos|ver el archivo adjunto/gi;
const RU_REGEX = /прикрепленный файл|прикреплённый файл|прикреплен|прикреплён|прикрепил|прикрепила/gi;
const IT_REGEX =
    /vedi in allegato|vedi allegato|vedi accluso|\u00e8 allegato|in allegato|sono allegati|in allegato vi sono|in allegato a questa email|in allegato a questo messaggio|invio in allegato|allego|ho allegato|in allegato trovi|trova in allegato|trova accluso|incluso troverai|file allegato|vedi allegato|vedi allegati|file allegati|vedi l'allegato|ti allego/gi;
const PT_PT_REGEX =
    /ver em anexo|ver anexo|ver inclu\u00eddo|est\u00e1 anexado|est\u00e1 em anexo|est\u00e3o anexados|est\u00e3o em anexo|anexado a este email|anexado a esta mensagem|estou a anexar|anexo|anexei|anexei|anexo|anexei|queira encontrar em anexo|segue em anexo|encontra-se inclu\u00eddo|segue inclu\u00eddo|ficheiro anexado|ver o anexo|ver anexos|ficheiros anexados|ver o anexo/gi;
const PT_BR_REGEX =
    /ver anexado|ver anexo|ver inclu\u00eddo|est\u00e1 anexado|anexado|est\u00e3o anexados|anexados|anexado a este e-mail|anexado a esta mensagem|estou anexando|eu estou anexando|anexei|eu anexei|estou incluindo|eu estou incluindo|inclu\u00ed|eu inclu\u00ed|enviar anexo|enviar o anexo|enviar inclu\u00eddo|ver anexos|arquivo anexado|arquivos anexados|em anexo|anexo|veja em anexo|veja o anexo|veja os anexos/gi;
const NL_REGEX =
    /zie bijgevoegd|zie bijlage|zie toegevoegd|is bijgevoegd|bijgevoegd is|zijn bijgevoegd|bijgevoegd zijn|toegevoegd aan dit e-mailbericht|toegevoegd aan dit bericht|Ik voeg bij|Ik heb bijgevoegd|Ik voeg een bijlage bij|Ik heb een bijlage bijgevoegd|bijlage bijvoegen|bijlagen bijvoegen|bijlage opgenomen|opgenomen bijlage|bijgevoegd bestand|zie de bijlage|zie bijlagen|bijgevoegde bestanden|de bijlage bekijken/gi;
const PL_REGEX =
    /patrz w za\u0142\u0105czeniu|patrz za\u0142\u0105cznik|patrz do\u0142\u0105czony|jest do\u0142\u0105czony|w za\u0142\u0105czeniu|s\u0105 za\u0142\u0105czone|za\u0142\u0105czone s\u0105|za\u0142\u0105czone do tego e-maila|do\u0142\u0105czone do tej wiadomo\u015bci|do\u0142\u0105czam|za\u0142\u0105czam|za\u0142\u0105czy\u0142em|za\u0142\u0105czy\u0142am|dodaj\u0119|wysy\u0142am|do\u0142\u0105czy\u0142em|do\u0142\u0105czy\u0142am|patrz za\u0142\u0105czniki|w za\u0142\u0105czniku|patrz za\u0142\u0105czony|patrz za\u0142\u0105czone|masz w za\u0142\u0105czeniu|za\u0142\u0105czony plik|zobacz za\u0142\u0105cznik|zobacz za\u0142\u0105czniki|za\u0142\u0105czone pliki/gi;

export const mentionAttachment = (content: string) => {
    switch (languageCode) {
        case 'en':
            return content.match(EN_REGEX);
        case 'fr':
            return content.match(FR_REGEX);
        case 'de':
            return content.match(DE_REGEX);
        case 'es':
            return content.match(ES_REGEX);
        case 'ru':
            return content.match(RU_REGEX);
        case 'it':
            return content.match(IT_REGEX);
        case 'pt':
            if (localeCode === 'pt_BR') {
                return content.match(PT_BR_REGEX);
            }
            return content.match(PT_PT_REGEX);
        case 'nl':
            return content.match(NL_REGEX);
        case 'pl':
            return content.match(PL_REGEX);
        default:
            return [];
    }
};
