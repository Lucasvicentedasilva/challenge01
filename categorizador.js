/**
 * Categorizador de produtos de supermercado
 * Identifica produtos equivalentes mesmo com variações na descrição
 */
const fs = require('fs');
const path = require('path');

/**
 * Função principal para categorizar produtos
 * @param {Array} products - Array de produtos a serem categorizados
 * @returns {Array} Array de categorias com seus produtos
 */
function categorizeProducts(products) {
  // Map para armazenar categorias e seus produtos
  const categoriesMap = new Map();
  
  // Normaliza e processa cada produto
  products.forEach(product => {
    const normalizedTitle = normalizeTitle(product.title);
    const key = generateProductKey(normalizedTitle);
    
    // Cria objeto do produto sem o id
    const productInfo = {
      title: product.title,
      supermarket: product.supermarket
    };
    
    // Adiciona à categoria existente ou cria nova
    if (categoriesMap.has(key)) {
      categoriesMap.get(key).products.push(productInfo);
    } else {
      categoriesMap.set(key, {
        category: product.title,
        products: [productInfo]
      });
    }
  });
  
  // Processa o resultado final e atualiza as contagens
  const result = Array.from(categoriesMap.values()).map(category => {
    return {
      category: category.category,
      count: category.products.length,
      products: category.products
    };
  });
  
  return result;
}

/**
 * Normaliza o título do produto
 * @param {string} title - Título original do produto
 * @returns {string} Título normalizado
 */
function normalizeTitle(title) {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[-]/g, ' ')            // Substitui hífens por espaços
    .replace(/\s+/g, ' ')            // Normaliza espaços múltiplos
    .replace(/litro/g, 'l')          // Padroniza unidades
    .replace(/quilo/g, 'kg')
    .trim();
}

/**
 * Gera chave de identificação única para um produto
 * @param {string} normalizedTitle - Título já normalizado
 * @returns {string} Chave única para identificação do produto
 */
function generateProductKey(normalizedTitle) {
  // Variáveis para armazenar características extraídas
  let productType = '';
  let brand = '';
  let variant = '';
  let size = '';
  
  // Identifica o tipo básico de produto
  if (normalizedTitle.includes('leite')) {
    productType = 'leite';
    
    // Extrai variante do leite
    if (normalizedTitle.includes('integral')) {
      variant = 'integral';
    } else if (normalizedTitle.includes('semi desnatado') || normalizedTitle.includes('semi-desnatado')) {
      variant = 'semi desnatado';
    } else if (normalizedTitle.includes('desnatado')) {
      variant = 'desnatado';
    }
    
    // Extrai marca do leite
    if (normalizedTitle.includes('piracanjuba')) {
      brand = 'piracanjuba';
    } else if (normalizedTitle.includes('italac')) {
      brand = 'italac';
    } else if (normalizedTitle.includes('parmalat')) {
      brand = 'parmalat';
    }
  } 
  else if (normalizedTitle.includes('arroz')) {
    productType = 'arroz';
    
    // Extrai variante do arroz
    if (normalizedTitle.includes('branco')) {
      variant = 'branco';
    } else if (normalizedTitle.includes('integral')) {
      variant = 'integral';
    }
    
    // Extrai marca do arroz
    if (normalizedTitle.includes('tio joao')) {
      brand = 'tio joao';
    }
  } 
  else if (normalizedTitle.includes('feijao') || normalizedTitle.includes('feijão')) {
    productType = 'feijao';
    
    // Extrai variante do feijão
    if (normalizedTitle.includes('carioca')) {
      variant = 'carioca';
    }
    
    // Extrai marca do feijão
    if (normalizedTitle.includes('camil')) {
      brand = 'camil';
    }
  }
  
  // Extrai tamanho/quantidade usando expressão regular
  const sizeRegex = /(\d+)\s*([kgl])/i;
  const sizeMatch = normalizedTitle.match(sizeRegex);
  if (sizeMatch) {
    size = `${sizeMatch[1]}${sizeMatch[2].toLowerCase()}`;
  }
  
  // Gera chave combinando as características extraídas
  return `${productType}-${brand}-${variant}-${size}`;
}

/**
 * Lê o arquivo JSON, categoriza os produtos e salva o resultado
 * @param {string} inputFilePath - Caminho para o arquivo de entrada (data01.json)
 * @param {string} outputFilePath - Caminho para o arquivo de saída (resultado.json)
 */
function processJsonFile(inputFilePath, outputFilePath = 'resultado.json') {
  try {
    // Lê o arquivo JSON
    const rawData = fs.readFileSync(inputFilePath, 'utf8');
    const products = JSON.parse(rawData);
    
    // Categoriza os produtos
    const categorizedProducts = categorizeProducts(products);
    
    // Salva o resultado em um novo arquivo JSON
    fs.writeFileSync(
      outputFilePath, 
      JSON.stringify(categorizedProducts, null, 2), 
      'utf8'
    );
    
    console.log(`Categorização concluída! Resultado salvo em ${outputFilePath}`);
    return categorizedProducts;
  } catch (error) {
    console.error('Erro ao processar o arquivo:', error.message);
    throw error;
  }
}

/**
 * Função principal para executar a partir da linha de comando
 */
function main() {
  // Determina o caminho do arquivo data01.json
  // Procura no diretório atual por padrão
  const defaultInputPath = path.join(process.cwd(), 'data01.json');
  const defaultOutputPath = path.join(process.cwd(), 'resultado.json');
  
  // Verifica argumentos da linha de comando para caminhos personalizados
  const args = process.argv.slice(2);
  const inputPath = args[0] || defaultInputPath;
  const outputPath = args[1] || defaultOutputPath;
  
  // Verifica se o arquivo de entrada existe
  if (!fs.existsSync(inputPath)) {
    console.error(`Erro: O arquivo ${inputPath} não foi encontrado.`);
    console.log('Uso: node categorizador.js [caminho-entrada] [caminho-saida]');
    process.exit(1);
  }
  
  // Processa o arquivo
  console.log(`Processando arquivo: ${inputPath}`);
  const result = processJsonFile(inputPath, outputPath);
  
  // Mostra um resumo do resultado
  console.log(`Total de categorias encontradas: ${result.length}`);
  console.log('Categorias:');
  result.forEach(category => {
    console.log(`- ${category.category}: ${category.count} produtos`);
  });
}

// Exporta funções para uso em outros módulos
module.exports = {
  categorizeProducts,
  normalizeTitle,
  generateProductKey,
  processJsonFile
};

// Executa a função principal se for chamado diretamente
if (require.main === module) {
  main();
}