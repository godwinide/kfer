function generatePassword(length = 12) {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()";
    let password = "";
    for (let i = 0; i < length; i++) {
        const charType = Math.floor(Math.random() * 4); // Choose a character type randomly
        const randomIndex = Math.floor(Math.random() * chars.length);
        switch (charType) {
            case 0: // Lowercase letter
                password += chars[randomIndex].toLowerCase();
                break;
            case 1: // Uppercase letter
                password += chars[randomIndex].toUpperCase();
                break;
            case 2: // Number
                password += chars[randomIndex].replace(/[a-zA-Z!@#$%^&*()]/g, ""); // Ensure only a number is added
                break;
            case 3: // Special character
                password += chars[randomIndex].replace(/[a-zA-Z0-9]/g, ""); // Ensure only a special character is added
                break;
        }
    }

    return password;
}


module.exports = generatePassword