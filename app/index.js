const xlsxj = require("xlsx-to-json");
const { readFileSync, existsSync, writeFileSync, unlinkSync, appendFileSync } = require('fs');
const { randomBytes } = require('crypto');
const { join, normalize } = require('path')

let pathApp = normalize(__dirname + '/../')
let config;
let configuracaoPadrao = {
    arquivo: join(pathApp, '/sample.xlsx'),
    chaves: ['Loja', 'DATA_MOVIMENTO', 'Codigo', 'NF_CUPOM', 'VALOR', 'Cnpj']
};
let chavesLidas = [];
let fileTmp = 'tmp-' + randomBytes(5).toString('hex');
let originais = {};
let duplicados = {};


const init = (res, rej) => {
    try {
        config = JSON.parse(readFileSync(join(pathApp, '/config.json'), 'utf-8'))
    } catch (err) {
        config = configuracaoPadrao
        writeFileSync(join(pathApp, '/config.json'), JSON.stringify(configuracaoPadrao), 'utf-8')
    }

    if (!config.arquivo) {
        config.arquivo = configuracaoPadrao.arquivo;
    }

    if (!existsSync(config.arquivo)) {
        return rej(new Error('Arquivo de configuração não encontrado.'));
    }

    if (!config.chaves || config.chaves.length === 0) {
        config.chaves = configuracaoPadrao.chaves;
    }

    for (let i = 0; i < config.chaves.length; i++) {
        config.chaves[i] = config.chaves[i].toUpperCase();
    }

    return res({ res, rej });
}

const parseXlsxToJson = (promise, result) => {

    xlsxj({
        input: config.arquivo,
        output: fileTmp
    }, (err, result) => separaRegistros(err, result, promise));

}

const separaRegistros = (err, result, promise) => {
    unlinkSync(fileTmp)
    if (err) throw err

    let key = ''

    if (existsSync('duplicados.csv')) unlinkSync('duplicados.csv');
    if (existsSync('originais.csv')) unlinkSync('originais.csv');

    let cabecalho = { originais: false, duplicados: false }

    for (let dado of result) {
        for (let chave of config.chaves) {
            key += dado[chave].trim()
        }

        if (chavesLidas.indexOf(key) > -1) {
            let fileName = 'duplicados.csv'

            if (!cabecalho.duplicados) {
                escreveCsv(fileName, dado, true)
                cabecalho.duplicados = true
            }

            escreveCsv(fileName, dado)

        } else {
            let fileName = 'originais.csv';

            chavesLidas.push(key);

            if (!cabecalho.originais) {
                escreveCsv(fileName, dado, true)
                cabecalho.originais = true
            }

            escreveCsv(fileName, dado)
        }
        key = '';
    }
    promise.res()
}

const escreveCsv = (file, obj, cabecalho = false) => {
    let data = ""
    for (let attr in obj) {
        data += cabecalho ? attr : obj[attr];
        data += ';'
    }
    appendFileSync(file, data + '\r\n')
}


const programa = new Promise(init)
    .then(parseXlsxToJson)
    .finally(() => {

    })
    .catch(err => console.log(err.message));