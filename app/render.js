'use strict';
const { readFileSync, existsSync, writeFileSync, unlinkSync, appendFileSync, readdirSync } = require('fs');
const { randomBytes } = require('crypto');
const { join, normalize } = require('path')
const excelToJson = require('convert-excel-to-json');
const { unzipSync } = require('zlib');

var btnCarregar = document.getElementById("btnCarregar");
var btnDepurar = document.getElementById("btnDepurarArea");
var labelSystem = document.getElementById("label");
var iptArquivo = document.getElementById('iptArquivo');
var fileTmp = 'tmp-' + randomBytes(5).toString('hex');
var divChaves = document.getElementById("chaves");
var loader = document.getElementById("loader");
var downloads = document.getElementById("downloadsArea")

var arquivo = '';
var chaves = [];
var chavesSelecionadas = [];
var chavesLidas = [];

var chavePadrao = ['LOJA', 'DATA_MOVIMENTO', 'CODIGO', 'NF_CUPOM', 'VALOR', 'CNPJ']

function init() {

  let arquivos = readdirSync(__dirname)
  arquivos.forEach(arq => {
    if (arq.startsWith('tmp-')) {
      unlinkSync(arq)
      console.log('Excluindo ' + arq);
    }
  })

  downloads.style.display = 'none';
  btnDepurar.style.display = 'none';
}

function depurarArquivo() {

  var key = '';

  if (!existsSync(fileTmp)) {
    alert("Carregue o arquivo antes de depurar");
    return
  }

  alert("Idenficando chaves selecionadas...");

  for (let elem of divChaves.children) {
    if (elem.children[1].checked) chavesSelecionadas.push(elem.children[1].id.toUpperCase())
  }

  if (chavesSelecionadas.length === 0) {
    alert('Nehuma coluna selecionada.');
    return;
  }

  if (existsSync('duplicados.csv')) unlinkSync('duplicados.csv');
  if (existsSync('originais.csv')) unlinkSync('originais.csv');

  let cabecalho = { originais: false, duplicados: false }
  let result = JSON.parse(readFileSync(fileTmp, 'utf-8'));

  alert("Depurando o arquivo.\nPor favor, aguarde!!");

  for (let dado of result) {
    key = "";
    for (let chave of chavesSelecionadas) {
      try {
        key += dado[chave].trim()
      } catch (e) {
        console.log('attr => ' + chave)
        console.log('obj => ' + JSON.stringify(dado))
        console.log(e.toString())
      }
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

  unlinkSync(fileTmp);
  alert("Depuração concluída com sucesso!!!");
  downloads.style = 'block';
}

function carregarArquivo() {

  if (iptArquivo.value === "") {
    alert('Nenhum arquivo informado');
    return
  }

  while (divChaves.children.length > 0) {
    for (let ch of divChaves.children) divChaves.removeChild(ch)
  }

  alert("Carregando arquivo de entrada.\nPor favor, aguarde!");

  init();

  arquivo = iptArquivo.files[0].path;

  var result = excelToJson({ sourceFile: arquivo })

  result = result[Object.keys(result)[0]];

  chaves = result.shift();

  var novoJson = []

  for (let row of result) {
    let obj = {}
    for (let attr in row) {

      obj[chaves[attr.toString().trim()]] = row[attr].toString().trim()

    }

    novoJson.push(obj)

  }

  writeFileSync(fileTmp, JSON.stringify(novoJson))

  for (let chave of Object.values(chaves)) {
    chave = chave.trim();
    if (!chave.trim()) continue;
    var label = document.createElement('label')
    var check = document.createElement('input')
    var div = document.createElement('div')

    check.type = 'checkbox';
    check.id = chave.toLowerCase();
    check.className = "form-check-input";

    if (chavePadrao.indexOf(chave) > -1) check.checked = true;

    label.innerHTML = chave;
    label.className = "form-check-label";
    label.htmlFor = chave.toLowerCase();

    div.className = "form-check form-switch col-6 text-start";
    div.appendChild(label);
    div.appendChild(check);

    divChaves.appendChild(div);

  }

  alert("Arquivo de entrada carregado com sucesso.\nSelecione os atributos.");
  btnDepurar.style = 'block';
}

const escreveCsv = (file, obj, cabecalho = false) => {
  let data = ""
  for (let attr in obj) {
    data += cabecalho ? attr : obj[attr];
    data += ';'
  }
  appendFileSync(file, data + '\r\n')
}
