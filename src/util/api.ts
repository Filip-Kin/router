export function requireInput(json, fields) {
    let missing = [];
    for (let key in fields) {
        if (!json.hasOwnProperty(key)) {
            missing.push(key);
            return;
        }
        if (json[key].length > fields[key]) missing.push(key);
    }
    return missing.length<1;
}