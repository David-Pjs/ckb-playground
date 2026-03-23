const { hd } = require("@ckb-lumos/lumos");
console.log("hd keys:", Object.keys(hd));
console.log("hd.key keys:", Object.keys(hd.key || {}));
