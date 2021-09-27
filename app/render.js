'use strict';
const { readFileSync, existsSync, writeFileSync, unlinkSync, appendFileSync } = require('fs');
const { randomBytes } = require('crypto');
const { join, normalize } = require('path')
const excelToJson = require('convert-excel-to-json');

var btnCarregar = document.getElementById("btnCarregar");
var btnDepurar = document.getElementById("btnDepurar");
var labelSystem = document.getElementById("label");
var iptArquivo = document.getElementById('iptArquivo');
var fileTmp = 'tmp-' + randomBytes(5).toString('hex');
var divChaves = document.getElementById("chaves");
var loader = document.getElementById("loader");
var downloads = document.getElementById("downloads")

var arquivo = '';
var chaves = [];
var chavesSelecionadas = [];
var chavesLidas = [];

function depurarArquivo() {

  var key = '';

  if (!existsSync(fileTmp)) {
    alert("Carregue o arquivo antes de depurar");
    return
  }

  alert("Idenficando chaves selecionadas..");

  for (let elem of divChaves.children) {
    if (elem.children[1].checked) chavesSelecionadas.push(elem.children[1].id.toUpperCase())
  }

  if (chavesSelecionadas.length === 0) {
    alert('Nehuma coluna selecionada');
    return;
  }

  if (existsSync('duplicados.csv')) unlinkSync('duplicados.csv');
  if (existsSync('originais.csv')) unlinkSync('originais.csv');

  let cabecalho = { originais: false, duplicados: false }
  let result = JSON.parse(readFileSync(fileTmp, 'utf-8'));

  alert("Depurando o arquivo");

  for (let dado of result) {
    key = "";
    for (let chave of chavesSelecionadas) {
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

  unlinkSync(fileTmp);
  alert("Depuração Concluída..");
}

function carregarArquivo() {

  if (iptArquivo.value === "") {
    alert('Nenhum arquivo informado');
    return
  }

  while (divChaves.children.length > 0) {
    for (let ch of divChaves.children) divChaves.removeChild(ch)
  }

  alert("Carregando arquivo de entrada..");

  arquivo = iptArquivo.files[0].path;

  var result = excelToJson({ sourceFile: arquivo })

  result = result[Object.keys(result)[0]];

  chaves = result.shift();

  var novoJson = {}

  for (let row of result) {

    for (let attr in row) {

      novoJson[chaves[attr]] = row[attr]

    }

  }

  writeFileSync(fileTmp, JSON.stringify(novoJson))


  for (let chave of Object.values(chaves)) {
    if (!chave) continue;
    var label = document.createElement('label')
    var check = document.createElement('input')
    var div = document.createElement('div')

    check.type = 'checkbox';
    check.id = chave.toLowerCase();
    check.classList = ['form-check-input'];

    label.innerHTML = chave;
    label.classList = ['form-check-label'];
    label.htmlFor = chave.toLowerCase();

    div.classList = ['form-check'];
    div.appendChild(label);
    div.appendChild(check);

    divChaves.appendChild(div);

  }

  alert("Arquivo de entrada Carregado com sucesso.\nSelecione os atributos.");

}

const escreveCsv = (file, obj, cabecalho = false) => {
  let data = ""
  for (let attr in obj) {
    data += cabecalho ? attr : obj[attr];
    data += ';'
  }
  appendFileSync(file, data + '\r\n')
}
