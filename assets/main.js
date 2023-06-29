let dataApi;
let dadosUltimaSemana;
let dadosUltimas4Semanas = [];
let dadosCompleto = [];

function carregarDados() {

  fetch("https://raw.githubusercontent.com/oquee/oquee/main/api/dados.json")
  .then((response) => response.json())
  .then((data) => {
      dadosCompleto = data;
      // Obter a última data de atualização
      let ultimaData = new Date(data.reduce((max, p) => p.data_atualizacao > max ? p.data_atualizacao : max, data[0].data_atualizacao));
      // Filtrar os dados pela última semana
      dadosUltimaSemana = dadosCompleto.filter(d => {
          // Convertendo date string para objeto Date
          let dataAtualizacao = new Date(d.data_atualizacao.split("/").reverse().join("/"));
          // Verificar se a data de atualização é dentro da última semana
          let umaSemanaAtras = new Date();
          umaSemanaAtras.setDate(umaSemanaAtras.getDate() - 7);
          return dataAtualizacao >= umaSemanaAtras;
      });
      // Ordenar os dados em relação ao percentual
      dadosUltimaSemana.sort((a, b) => b.percent_trends - a.percent_trends);
      // Chamar a função para criar o treemap com os dados filtrados e ordenados
      dadosUltimaSemana = dadosUltimaSemana.slice(0, 15);
      createdTreeMap(dadosUltimaSemana, "#treemap-week", 5, 7);
 
  

      let dataAtualizacao = data.reduce((max, p) => p.atualizacao > max ? p.data_atualizacao : max, data[0].atualizacao);
      console.log("dataAtualizacao:", dataAtualizacao)

      document.querySelector("section.container.week > p.update").innerText = `Dados atualizados em ${dataAtualizacao}`

      document.querySelector("section.container.month > p.update").innerText = `Dados atualizados em ${dataAtualizacao}`

      let trintaDiasAtras = new Date();
      trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);
    
      dadosUltimas4Semanas = dadosCompleto.filter(d => {
          // Convertendo date string para objeto Date
          let dataAtualizacao = new Date(d.data_atualizacao.split("/").reverse().join("/"));
          return dataAtualizacao >= trintaDiasAtras;
      });
    
      // Removendo dados duplicados com base no termo
      dadosUltimas4Semanas = Array.from(new Set(dadosUltimas4Semanas.map(a => a.termo)))
        .map(termo => {
            return dadosUltimas4Semanas.find(a => a.termo === termo)
        })
      
      // Ordenar os dados em relação ao percentual
      dadosUltimas4Semanas.sort((a, b) => b.percent_trends - a.percent_trends);
    
      // Chamar a função para criar o treemap com os dados filtrados e ordenados
      dadosUltimas4Semanas = dadosUltimas4Semanas.slice(0, 15);
      createdTreeMap(dadosUltimas4Semanas, "#treemap-month", 5, 7);
    })
    .catch((error) => console.error(error));

}

carregarDados()

let btnsWeek = document.querySelectorAll("section.container.week .btn")



//  verifica se a tela mudou de resolucao (width) para criar um novo grafico
let initialWidth = window.innerWidth;

window.addEventListener('resize', function(event) {
    let newWidth = window.innerWidth;
    if(newWidth !== initialWidth) {
        document.querySelector('#treemap-week > svg').remove();
        document.querySelector('#treemap-month > svg').remove();
        createdTreeMap(dadosUltimaSemana, '#treemap-week', 5, 7);
        createdTreeMap(dadosUltimas4Semanas, '#treemap-month', 5, 7);
        initialWidth = newWidth;
    }
});


function createdTreeMap(data, idMapa, viewsDesk, viewsMobile) {
  const margin = { top: 10, right: 0, bottom: 10, left: 0 };
  let dataIntervalo;
  let width, height;

  if (window.innerWidth - margin.left - margin.right < 660) {
    width = window.innerWidth - margin.left - margin.right;
    dataIntervalo = data.slice(0, viewsDesk);
  } else {
    width = 900;
    dataIntervalo = data.slice(0, viewsMobile);
  }

  height = 500;

  const svg = d3
    .select(idMapa)
    .append("svg")
    .attr(
      "viewBox",
      `0 0 ${width + margin.left + margin.right} ${
        height + margin.top + margin.bottom
      }`
    )
    .attr("preserveAspectRatio", "xMidYMid meet")
    .append("g")
    .attr("id", "treemap")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  const root = d3
    .hierarchy({ values: dataIntervalo }, function (d) {
      return d.values;
    })
    .sum(function (d) {
      // return d.percent_trends;
      return d.percent_trends;
    })
    .sort(function (a, b) {
      return b.value - a.value;
    });

  d3.treemap().size([width, height]).padding(4).round(true).paddingInner(5)(
    root
  );

  root.leaves().sort(function (a, b) {
    return b.value - a.value;
  });

  const top10 = root.leaves().slice(0, 10);

  const leaf = svg
    .selectAll("g")
    .data(root.leaves())
    .enter()
    .append("g")
    .attr("id", function (d) {
      let termo = (d.data.permalink ? d.data.permalink : (d.data.termo ? d.data.termo : "")).replace(/\s+/g, "-");
      return removerAcentos(termo.toLowerCase());
    })
    
    .attr("percentual", function (d) {
      return d.data.percent_trends;
    })
    .attr("transform", function (d) {
      return "translate(" + d.x0 + "," + d.y0 + ")";
    })
    .on("click", function (d) {
      var dominioAtual = window.location.protocol + "//" + window.location.host;
      var permalink = d3.select(this).attr("id").toLowerCase();
      window.location.href = dominioAtual + "/o-que-e-" + permalink;
    });

  leaf
    .append("a") // Adiciona o elemento de âncora
    .attr("href", function (d) {
      // Define o link para cada retângulo
      return "https://www.example.com/" + d.data.termo;
    })
    .append("rect")
    .attr("width", function (d) {
      const termoWidth =
        d.data.termo.length > 10 ? Math.max(d.x1 - d.x0, 70) : d.x1 - d.x0;
      return termoWidth;
    })
    .attr("height", function (d) {
      return d.y1 - d.y0;
    })
    .style("stroke-width", "6px")
    .style("stroke", "#F9FBFD")
    .style("fill", function (d) {
      switch (d.data.categoria) {
        case "Economia":
          return "#4285F4";
        case "Saude":
          return "#43B97F";
        case "Cultura":
          return "#FFCA3A";
        case "Politica":
          return "#FD7E40";
        case "Esportes":
          return "#C280D2";
        case "Outros":
          return "#9A9A9A";
        default:
          return "#CCCCCC";
      }
    })
    .style("rx", 15)
    .on("click", function (d) {
      window.open("https://www.example.com/" + d.data.termo, "_blank");
    });

  leaf
    .append("foreignObject")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", function (d) {
      return d.x1 - d.x0 - 0;
    })
    .attr("height", function (d) {
      return d.y1 - d.y0 - 0;
    })
    .append("xhtml:div")
    .style("font-size", "18px")
    .style("font-weight", "600")
    .style("color", "white")
    .style("padding", "20px")
    .style("padding-left", "10px")
    .style("box-sizing", "border-box")
    .html(function (d) {

      let labelValue
      if (d.data.percent_trends >= 5000) {
        labelValue = "+5.000"
      } else {
        labelValue = d.data.percent_trends.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
      }
      return (
        "<div class='termo'>" +
        d.data.termo.toLowerCase() +
        "</div><div class='vezes_subida'>" +
        labelValue +
        // d.data.percent_trends +
        // Math.round(d.data.percentual) +
        "%</div>"
      );
    });

  addTextFirstElement(idMapa);
}



function addTextFirstElement(idMapa) {
  const text = document.querySelector(
    idMapa + " g g:nth-child(1) foreignObject > div .vezes_subida"
  );
  const infoText = text.innerHTML;
  // console.log(text);
  text.innerHTML = `<strong>${infoText}</strong> mais buscas na última semana`;
}

// Seleciona os elementos dos menus
let menuWeek = document.querySelector(
  "section.container.week > .menu-categories"
);
let menuMonth = document.querySelector(
  "section.container.month > .menu-categories"
);

let existingWidth, existingHeight;

// Função para adicionar o evento de clique a cada botão do menu
function addMenuClickEvent(menu, tipo) {
  // Seleciona todos os botões do menu
  
// Seleciona todos os botões do menu
const menuButtons = menu.querySelectorAll(".btn");

// Remove a classe "active" de todos os botões antes de adicionar o evento de clique
menuButtons.forEach(function (button) {
  button.addEventListener("click", function () {
    // Remove a classe "active" de todos os botões
    menuButtons.forEach(function (btn) {
      btn.classList.remove("active");
    });

    // Adiciona a classe "active" ao botão clicado
    this.classList.add("active");
  });
});


  // Adiciona um evento de clique a cada botão do menu
  menuButtons.forEach((button) => {

    button.addEventListener("click", () => {
      console.log(tipo);

      button.classList.add("active")

      let categoriaBtn = button.textContent;
      console.log("🚀 categoriaBtn:", button)
      console.log("categoriaBtn:", categoriaBtn);

      let treemapContainer = document.querySelector(`#treemap-${tipo}`);
      let existingSvg = treemapContainer.querySelector("svg");
      

      if (existingSvg) {
        existingWidth = existingSvg.clientWidth;
        existingHeight = existingSvg.clientHeight;
        existingSvg.remove();
      }

      // Remover o elemento semDadosText existente
      let existingSemDadosText = treemapContainer.querySelector("p");
      if (existingSemDadosText) {
        existingSemDadosText.remove();
      }

      if (tipo === "week") {

        if (categoriaBtn === "Todos") {

          createdTreeMap(dadosUltimaSemana, `#treemap-${tipo}`, 5, 7);
          
        } else {
          dadosFiltrados = dadosUltimaSemana.filter((item) => item.categoria.substring(0, 2) === categoriaBtn.substring(0, 2));

          console.log("categoriaBtn-week:", dadosFiltrados);

          if (dadosFiltrados.length > 0) {
            createdTreeMap(dadosFiltrados, `#treemap-${tipo}`, 5, 7);
          } else {
            const semDadosText = document.createElement("p");
            semDadosText.textContent = "Não há termos desta categoria";
            semDadosText.style.width = existingWidth ? existingWidth + "px" : "100%";
            semDadosText.style.height = existingHeight ? existingHeight + "px" : "100%";
            semDadosText.style.margin = "0";
            semDadosText.style.paddingTop = "35px";
            semDadosText.style.display = "flex";
            semDadosText.style.justifyContent = "center";
            semDadosText.style.alignItems = "flex-start";
            document.querySelector(`#treemap-${tipo}`).appendChild(semDadosText);
          }
        }
        
        
      } else if (tipo === "month") {

        if (categoriaBtn === "Todos") {

          createdTreeMap(dadosUltimas4Semanas, `#treemap-${tipo}`, 5, 7);
          
        } else {

          dadosFiltrados = dadosUltimas4Semanas.filter((item) => item.categoria.substring(0, 2) === categoriaBtn.substring(0, 2));

          if (dadosFiltrados.length > 0) {
            createdTreeMap(dadosFiltrados, `#treemap-${tipo}`, 5, 7);
          } else {
            const semDadosText = document.createElement("p");
            semDadosText.textContent = "Não há termos desta categoria";
            semDadosText.style.width = existingWidth ? existingWidth + "px" : "100%";
            semDadosText.style.height = existingHeight ? existingHeight + "px" : "100%";
            semDadosText.style.margin = "0";
            semDadosText.style.paddingTop = "35px";
            semDadosText.style.display = "flex";
            semDadosText.style.justifyContent = "center";
            semDadosText.style.alignItems = "flex-start";
            document.querySelector(`#treemap-${tipo}`).appendChild(semDadosText);
          }
  
          console.log("categoriaBtn-month:", dadosFiltrados);

        }
       
      }
  

      // Obtém a posição da div clicada em relação ao menu
      const position = button.getBoundingClientRect().left - 12; // Deixar margem left de 12px
      console.log(button);
      console.log(position);
      // Faz a rolagem para a posição desejada
      menu.scrollLeft += position;
    });
  });
};

// Adiciona o evento de clique ao menuWeek
addMenuClickEvent(menuWeek, "week");

// Adiciona o evento de clique ao menuMonth
addMenuClickEvent(menuMonth, "month");

function closeSearch() {
  document.querySelector(".container-search").style.display = "none" 
}

function btnSearchSugestoes() {
  document.querySelector(".container-search").style.display = "flex";
  document.querySelector("div.filter > p.text").innerText = "Sugestões de termos";
  const maxTermos = 7;

  const listView = document.querySelector('.list-view');
  
  // Limpa os elementos h3 existentes
  while (listView.firstChild) {
    listView.removeChild(listView.firstChild);
  }
  
  for (let i = 0; i < dadosUltimas4Semanas.length && i < maxTermos; i++) {
    let termo = dadosUltimas4Semanas[i].termo;
    let permalink = dadosUltimas4Semanas[i].permalink;
    
    if (permalink === "") {
      permalink = getDomain() + "/o-que-e-" + removerAcentos(termo.toLowerCase()); // Usa a variável "termo" em minúsculas
    } else {
      permalink = getDomain() + "/o-que-e-" + permalink; // Adiciona o permalink ao domínio do próprio site
    }
    
    
    let tagA = document.createElement('a');
    tagA.textContent = termo;
    tagA.classList.add("term");
    tagA.href = permalink; // Define o atributo href com o permalink ou com o termo em minúsculas
    document.querySelector('.list-view').appendChild(tagA);
  }
}


function removerAcentos(texto) {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function btnSearch() {
  const searchInput = document.getElementById('search-input');
  const listView = document.querySelector('.list-view');
  const totalCaracteres = searchInput.value.length;
  
  // Limpa os elementos h3 existentes
  while (listView.firstChild) {
    listView.removeChild(listView.firstChild);
  }

  if (totalCaracteres == 0) {
    document.querySelector("div.filter > p.text").innerText = "Sugestões de termos"

  } else {
    document.querySelector("div.filter > p.text").innerText = "Você busca por..."

  }
  
  const termoBuscado = removerAcentos(searchInput.value.toLowerCase());
  const maxTermos = 7;
  let contador = 0;
  
  dadosCompleto.forEach(item => {
    const termo = removerAcentos(item.termo.toLowerCase());
    
    if (termo.includes(termoBuscado) && contador < maxTermos) {
      let tagA = document.createElement('a');
      tagA.textContent = item.termo;
      listView.appendChild(tagA);
      contador++;
      let permalink = item.permalink;
      
      if (permalink === "") {
        permalink = getDomain() + "/o-que-e-" + removerAcentos(termo.toLowerCase()); // Usa a variável "termo" em minúsculas
      } else {
        permalink = getDomain() + "/o-que-e-" + permalink; // Adiciona o permalink ao endereço do próprio site
      }
      tagA.href = permalink;

    }
  });
}

const searchInput = document.getElementById('search-input');
searchInput.addEventListener('input', btnSearch);


document.querySelector(".container-search .bg-popup").addEventListener("click", e => {
  document.getElementById("popup").style.display = "none"
})

// Função para obter o domínio do site
function getDomain() {
  return window.location.protocol + "//" + window.location.host;
}



  // ATIVANDO BOTÃO DO MENU

  let btnMenu = document.querySelector("div.items-menu > img");

  btnMenu.addEventListener("click", e => {
    document.querySelector("body > section.container-menu").style.display = "flex";

  });


  let btnMenuClose = document.querySelector("div.column-2.menu-topo > nav > div > img")

  btnMenuClose.addEventListener("click", e => {
    document.querySelector("body > section.container-menu").style.display = "none"
  })

// ANIMACAO DA CAIXA DO QUE É

// const tituloElement = document.getElementById("title-h1");
// const textos = ["CPI?", "BBB?"];
// let index = 0;

// function typeWriter() {
//   const textoAtual = textos[index];
//   const textoCompleto = tituloElement.textContent;

//   if (textoCompleto !== textoAtual) {
//     tituloElement.textContent = textoAtual.slice(0, textoCompleto.length + 1);
//     tituloElement.style.borderRight = "none"; // Remove a borda
//     setTimeout(function () {
//       tituloElement.style.borderRight = "0.15em solid #000"; // Reaplica a borda
//     }, 50);
//     setTimeout(typeWriter, 100);
//   } else {
//     setTimeout(function () {
//       tituloElement.textContent = ""; // Apaga o texto anterior
//       tituloElement.style.borderRight = "none"; // Remove a borda
//       index = (index + 1) % textos.length;
//       typeWriter();
//     }, 2000);
//   }
// }

// typeWriter();


