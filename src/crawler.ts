import axios from 'axios';             // atenção, código comentado temporariamente para facilitar a compreensão , depois será removido
import * as cheerio from 'cheerio';     
import * as fs from 'fs';               
import * as path from 'path';         

// URL base do site hospedado no GitHub Pages
const siteBase = 'https://thedevsara.github.io/projeto_buscador/';

// Página inicial que o crawler começa a visitar
const paginaInicial = 'blade_runner.html';

// Pasta onde as páginas baixadas serão salvas
const pastaDestino = 'paginas_baixadas';

// Conjunto que armazena os links que já foram visitados (para evitar repetições)
const paginasVisitadas = new Set<string>();

// Cria a pasta de destino se ela ainda não existir
if (!fs.existsSync(pastaDestino)) {
  fs.mkdirSync(pastaDestino);
}

/**
 * Função que baixa o conteúdo HTML de uma página a partir da URL
 */
async function pegarHTML(url: string): Promise<string> {
  const resposta = await axios.get(url);
  return resposta.data; // retorna o HTML da página
}

/**
 * Função que salva o conteúdo HTML em um arquivo local
 */
function salvarPagina(nomeArquivo: string, conteudoHTML: string): void {
  const caminhoCompleto = path.join(pastaDestino, nomeArquivo);
  fs.writeFileSync(caminhoCompleto, conteudoHTML, 'utf-8');
}

/**
 * Função que analisa o HTML e encontra todos os links internos da página
 */
function encontrarLinks(html: string, origem: string): string[] {
  const $ = cheerio.load(html); // carrega o HTML com cheerio
  const linksEncontrados: string[] = [];

  $('a[href]').each((_index, elemento) => {
    const destino = $(elemento).attr('href');
    
    // Só pega links .html que são internos (não começam com http)
    if (destino && destino.endsWith('.html') && !destino.startsWith('http')) {
      const linkAbsoluto = new URL(destino, origem).href;

      // Evita repetir páginas já visitadas
      if (!paginasVisitadas.has(linkAbsoluto)) {
        linksEncontrados.push(linkAbsoluto);
      }
    }
  });

  return linksEncontrados;
}

/**
 * Função principal que visita a página, salva o conteúdo e segue os links internos
 */
async function rastrear(url: string): Promise<void> {
  // Se já visitou, não repete
  if (paginasVisitadas.has(url)) return;

  paginasVisitadas.add(url);
  console.log(`🔎 Rastreando: ${url}`);

  try {
    const html = await pegarHTML(url);           // Baixa o HTML da página
    const nomeArquivo = path.basename(url);      // Pega o nome do arquivo da URL (ex: matrix.html)
    salvarPagina(nomeArquivo, html);             // Salva a página localmente

    const linksNaPagina = encontrarLinks(html, url); // Pega os links dentro da página
    for (const proximoLink of linksNaPagina) {
      await rastrear(proximoLink);               // Visita os próximos links encontrados
    }
  } catch (erro) {
    console.error(`Erro ao acessar ${url}:`, (erro as any).message);
  }
}

// Início do rastreamento a partir da primeira página
const urlDePartida = new URL(paginaInicial, siteBase).href;
rastrear(urlDePartida);
