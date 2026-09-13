const chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

function encodeBase62(num){
    result = "";
    while(num>0){
        result = chars[num % 62] + result;
        num = Math.floor(num / 62);
    }
    return result || "a";
}

module.exports = encodeBase62;