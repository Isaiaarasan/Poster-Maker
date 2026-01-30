const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: 'dzbdnlr0l', // Trying a likely random string is impossible, but let's try the username? No, let's try 'isaiaarasan'
    api_key: '575535787787495',
    api_secret: 'CeVW6cwxodvgap_RlmxXxG6zo20'
});

// We will try to upload to see if credentials work.
// Actually, without the correct cloud_name, we can't do anything.
// I will just ask the USER.
