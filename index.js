
// Import Modules
var fs = require('fs');
const path_archive = './archive';
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const colors = require('colors');

const my_number = '249123123123@c.us'

// Define Whatsapp Client
const client = new Client({
    authStrategy: new LocalAuth({ clientId: 'user' }),
});

// Whatsapp => Create QR Code
client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
});

// Whatsapp => Auth Failure
client.on('auth_failure', () => {
    defineReportsCustomLogs("Whatsapp", "Error during the LocalAuth() authentication.\n", "auth_failure")
});

// Whatsapp => Authenticated
client.on('authenticated', () => {
    defineReportsCustomLogs("Whatsapp", "Whatsapp authentication successfully.", "authenticated")
});

// Whatsapp => Client Ready
client.on('ready', () => {
    defineReportsCustomLogs("Whatsapp", "Whatsapp Client is ready!", "whatsapp_ready")
    if (!fs.existsSync(path_archive)){
        fs.mkdirSync(path_archive);
        defineReportsCustomLogs("PATH", 'The "archive" folder was successfully created.', "path_folder")
    } console.log('\n');
});

// Whatsapp => Event Listener New Messages
client.on('message', async (message) => {
    var isNotViewOnce = true;
    var contact = await message.getContact();
    var phone_number = contact.number;
    var path_contact = String(path_archive+'/'+phone_number);
    var user_type = defineMessageUserType(contact.isUser, contact.isGroup);
    var date_string = defineMessageDateString(message.timestamp);
    if(message.hasMedia == true){
        if(message.isStatus == false && message.isGif == false){
            if(message._data.isViewOnce == true){
                if (!fs.existsSync(path_contact)){
                    fs.mkdirSync(path_contact);
                    defineReportsCustomLogs("PATH", 'The "'+phone_number+'" folder was successfully created.', "path_folder")
                }
                defineReportsCustomLogs(message.type, 'View-once chat received from "'+contact.name+'"', "whatsapp_viewonce");
                const media = await message.downloadMedia();
                var mediaRandomKey = Math.floor(10000 + Math.random() * 90000);
                var mediaFilename = phone_number+'_'+user_type+'_'+date_string+"_"+mediaRandomKey;
                if(message.type == 'image' && media.mimetype == 'image/jpeg'){
                    var mediaSource = "data:"+media.mimetype+";base64,"+media.data;
                    mediaSource = mediaSource.replace(/^data:image\/\w+;base64,/, "");
                    var mediaBase64 = Buffer.from(mediaSource, 'base64');
                    fs.writeFileSync(path_contact+'/'+mediaFilename+'.png', mediaBase64);
                    // Sending the image to 'my_number'
                    const image_name = mediaFilename+'.png';
                    const mediaBuffer = fs.readFileSync(path_contact+'/'+image_name);
                    const mediaMessage = MessageMedia.fromFilePath(path_contact+'/'+image_name);
                    // client.sendMessage(message.from, mediaMessage);
                    client.sendMessage(my_number, mediaMessage);
                } else if(message.type == 'video' && media.mimetype == 'video/mp4'){
                    var mediaSource = "data:"+media.mimetype+";base64,"+media.data;
                    mediaSource = mediaSource.replace(/^data:(.*?);base64,/, "");
                    mediaSource = mediaSource.replace(/ /g, '+');
                    var mediaBase64 = Buffer.from(mediaSource, 'base64');
                    fs.writeFileSync(path_contact+'/'+mediaFilename+'.mp4', mediaBase64);
                    // Sending the video to 'my_number'
                    const video_name = mediaFilename+'.mp4';
                    const mediaBuffer = fs.readFileSync(path_contact+'/'+video_name);
                    const mediaMessage = MessageMedia.fromFilePath(path_contact+'/'+video_name);
                    // client.sendMessage(message.from, mediaMessage);
                    client.sendMessage(my_number, mediaMessage);
                } else if(message.type == 'ptt' && media.mimetype == 'audio/ogg; codecs=opus'){
                    // Handle audio messages (ptt)
                    var mediaBase64 = Buffer.from(media.data, 'base64');
                    fs.writeFileSync(path_contact+'/'+mediaFilename+'.ogg', mediaBase64);
                    // Sending the audio to 'my_number'
                    const audio_name = mediaFilename+'.ogg';
                    const mediaBuffer = fs.readFileSync(path_contact+'/'+audio_name);
                    const mediaMessage = MessageMedia.fromFilePath(path_contact+'/'+audio_name);
                    // client.sendMessage(message.from, mediaMessage);
                    client.sendMessage(my_number, mediaMessage);
                }
                isNotViewOnce = false;
            }
        }
    }
    if(isNotViewOnce){ defineReportsCustomLogs(message.type, 'Normal chat received from "'+contact.name+'"', "whatsapp_message"); }
});

// Whatsapp => Client Initialize
client.setMaxListeners(100);
client.initialize();

// Functions => Define User Type for a Message
function defineMessageUserType(user,group){
    if(user && !group){ return 'chat'; }
    else if(!user && group){ return 'group'; }
    else{ return 'chat'; }
}

// Functions => Define Date String for a Message
function defineMessageDateString(unix){
    var date = new Date(unix * 1000)
    var day = String(date.getUTCDate()).padStart(2, '0');
    var month = String(date.getUTCMonth() + 1).padStart(2, '0');
    var year = date.getUTCFullYear();
    var hours = String(date.getUTCHours()).padStart(2, '0');
    var minutes = String(date.getUTCMinutes()).padStart(2, '0');
    var seconds = String(date.getUTCSeconds()).padStart(2, '0');
    return String(year+month+day+hours+minutes+seconds);
}

// Functions => Define Custom Logs for OS Terminal
function defineReportsCustomLogs(head, data, type){
    var headSpc = '  ';
    var headTxt = head;
    var headLen = head.length;
    var headDif = 10 - headLen;
    for (let i = 0; i <= headDif; i++) { headTxt += ' '; }
    var headSta = headSpc + headTxt;
    var headEnd = data + headSpc;
    if(type == 'authfailure'){ console.log( colors.red( headSta, headEnd ) ); }
    if(type == 'authenticated'){ console.log( colors.cyan( headSta, headEnd ) ); }
    if(type == 'whatsapp_ready'){ console.log( colors.green( headSta, headEnd ) ); }
    if(type == 'whatsapp_message'){ console.log( colors.white( headSta, headEnd ) ); }
    if(type == 'whatsapp_viewonce'){ console.log( colors.yellow( headSta, headEnd ) ); }
    if(type == 'path_folder'){ console.log( colors.blue( headSta, headEnd ) ); }
};

// Functions => Define Custom Init for OS Terminal
function init(){
    console.log('\n');
    console.log(colors.yellow('   ███ ███   ██████  ███████    ██    ██       ███████ ████████ ██████  '));
    console.log(colors.yellow('  ██ ███ ██ ██    ██ ██       ██  ██  ██       ██         ██    ██   ██ '));
    console.log(colors.yellow('  ██  █  ██ ██    ██ ███████ ██    ██ ██       ███████    ██    █████   '));
    console.log(colors.yellow('  ██     ██ ██    ██ ██      ████████ ██            ██    ██    ██  ██  '));
    console.log(colors.yellow('  ██     ██  ██████  ███████ ██    ██ ████████ ███████ ████████ ██   ██ '));
    console.log('\n');
    console.log(colors.cyan('  WHATSAPP WEB - VIEW ONCE .JS'));
    console.log('  https://github.com/Moealsir/wwjs-viewonce\n');
} init();
