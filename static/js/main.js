// ============================================================================
// VARIABLES GLOBAIS ESTÁVEIS (Declaradas estritamente uma única vez)
// ============================================================================
let parqueMaquinas = [];
let listaProcessos = [];
let listaInsumos = [];
let custoMinutoImobiliarioGlobal = 0;
let totalInvestidoEstrutura = 0;
let totalInvestidoMaquinas = 0;
let lucroPorPecaGlobal = 0;

document.addEventListener('DOMContentLoaded', () => {
    // 1. Menu Hamburger Responsivo
    const menuToggle = document.getElementById('menuToggle');
    const navMenu = document.getElementById('navMenu');
    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', () => {
            const expandido = menuToggle.getAttribute('aria-expanded') === 'true';
            menuToggle.setAttribute('aria-expanded', !expandido);
            navMenu.classList.toggle('active');
        });
    }

    // 2. Dropdowns em Cascata Acessíveis
    const dropdowns = document.querySelectorAll('.dropdown');
    dropdowns.forEach(dropdown => {
        const btn = dropdown.querySelector('.dropdown-toggle');
        if (btn) {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const isOpen = dropdown.classList.contains('open');
                dropdowns.forEach(d => {
                    d.classList.remove('open');
                    d.querySelector('.dropdown-toggle').setAttribute('aria-expanded', 'false');
                });
                if (!isOpen) {
                    dropdown.classList.add('open');
                    btn.setAttribute('aria-expanded', 'true');
                }
            });
        }
    });

    // 3. IDENTIFICADOR DE PÁGINAS: Executa as funções apenas se a tabela ou select existir na tela
    if (document.getElementById('tabelaMaquinas')) carregarMaquinasDoServidor();
    if (document.getElementById('procSelecaoMaquina')) carregarProcessosEAtivosFabrica();
    if (document.getElementById('tabelaInsumos')) renderizarTabelaInsumos();
    if (document.getElementById('custoTotal')) carregarEMotorCustoGlobal();
});

// Acessibilidade Visuo-Auditiva
function toggleContraste() { document.body.classList.toggle('alto-contraste'); }
let tamanhoFonteAtual = 100;
function alterarFonte(direcao) {
    tamanhoFonteAtual += (direcao * 10);
    if (tamanhoFonteAtual >= 80 && tamanhoFonteAtual <= 140) {
        document.documentElement.style.fontSize = `${tamanhoFonteAtual}%`;
    }
}
function emitirAudioTexto(texto) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const mensagem = new SpeechSynthesisUtterance(texto);
        mensagem.lang = 'pt-BR';
        window.speechSynthesis.speak(mensagem);
    }
}




// ============================================================================
// 2. MÓDULO IMOBILIÁRIO (PÁGINA: terreno.html)
// ============================================================================
async function calcularCustosImobiliarios() {
    const valor_terreno = parseFloat(document.getElementById('imoTerreno').value) || 0;
    const custo_edificacao = parseFloat(document.getElementById('imoEdificacao').value) || 0;
    const vida_util_anos = parseInt(document.getElementById('imoVidaUtil').value) || 1;
    const impostos_anuais = parseFloat(document.getElementById('imoImpostos').value) || 0;
    const horas_operacionais_ano = parseInt(document.getElementById('imoHorasAno').value) || 1;

    if (valor_terreno <= 0 || custo_edificacao <= 0) {
        alert("Preencha as variáveis de entrada.");
        return;
    }

    const response = await fetch('/api/imobiliario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ valor_terreno, custo_edificacao, vida_util_anos, impostos_anuais, horas_operacionais_ano })
    });

    if (response.ok) {
        const data = await response.json();
        localStorage.setItem('custoMinutoImobiliario', data.custoMinutoInstalacao);
        localStorage.setItem('totalInvestidoEstrutura', (valor_terreno + custo_edificacao).toString());
        
        const box = document.getElementById('resultadoImobiliario');
        if (box) {
            box.style.display = 'block';
            box.innerHTML = `<p>Custo da Instalação fixado em R$ ${data.custoMinutoInstalacao.toFixed(4)} por minuto.</p>`;
        }
        emitirAudioTexto("Custos imobiliários salvos.");
    }
}

// ============================================================================
// 3. MÓDULO DE ATIVOS & MÁQUINAS CNC (PÁGINA: maquinas.html)
// ============================================================================
async function carregarMaquinasDoServidor() {
    try {
        const response = await fetch('/api/maquinas');
        if (response.ok) {
            parqueMaquinas = await response.json();
            renderizarTabelaMaquinas();
        }
    } catch (err) { console.error("Erro ao ler banco PostgreSQL: ", err); }
}

async function adicionarMaquinaServidor() {
    const elId = document.getElementById('maquinaIdOculto');
    const elNome = document.getElementById('maquinaNome');
    const elPreco = document.getElementById('maquinaPreco');
    const elVidaUtil = document.getElementById('maquinaVidaUtil');
    const elValorRevenda = document.getElementById('maquinaValorRevenda');
    const elManutencao = document.getElementById('maquinaManutencao');
    const elHorasAno = document.getElementById('maquinaHorasAno');
    const elPotencia = document.getElementById('maquinaPotencia');
    const elTarifa = document.getElementById('maquinaTarifa');
    const elAq = document.getElementById('maquinaAquisicao');
    const elPrev = document.getElementById('maquinaPrev');
    const elDiam = document.getElementById('maquinaDiametro');
    const elComp = document.getElementById('maquinaComprimento');

    if (!elNome || !elPreco) return;

    const id_maquina = elId ? elId.value : '';
    const nome = elNome.value.trim();
    const preco = parseFloat(elPreco.value) || 0;
    const vidaUtil = elVidaUtil ? parseInt(elVidaUtil.value) || 1 : 1;
    const valorRevenda = elValorRevenda ? parseFloat(elValorRevenda.value) || 0 : 0;
    const manutencao = elManutencao ? parseFloat(elManutencao.value) || 0 : 0;
    const horasAno = elHorasAno ? parseInt(elHorasAno.value) || 1 : 1;
    const potencia_kw = elPotencia ? parseFloat(elPotencia.value) || 0 : 0;
    const tarifa_kwh = elTarifa ? parseFloat(elTarifa.value) || 0 : 0;
    const data_aquisicao = elAq ? elAq.value : '';
    const data_manutencao = elPrev ? elPrev.value : '';
    const diametro_mm = elDiam ? parseFloat(elDiam.value) || 0 : 0;
    const comprimento_mm = elComp ? parseFloat(elComp.value) || 0 : 0;

    if (!nome || preco <= 0) { alert("Preencha o nome e preço do ativo."); return; }
    const metodo = id_maquina ? 'PUT' : 'POST';

    const response = await fetch('/api/maquinas', {
        method: metodo,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            id: id_maquina, nome: nome, preco: preco, vida_util: vidaUtil, 
            valor_revenda: valorRevenda, manutencao: manutencao, horas_ano: horasAno, 
            potencia_kw: potencia_kw, tarifa_kwh: tarifa_kwh,
            data_aquisicao: data_aquisicao, data_manutencao: data_manutencao, 
            diametro_mm: diametro_mm, comprimento_mm: comprimento_mm
        })
    });

    if (response.ok) {
        if(elId) elId.value = '';
        if(elNome) elNome.value = '';
        const btnSalvar = document.getElementById('btnSalvarAtivo');
        if (btnSalvar) btnSalvar.innerText = "Salvar e Registrar Ativo";
        carregarMaquinasDoServidor();
        emitirAudioTexto("Equipamento gravado no banco de dados.");
    }
}

function renderizarTabelaMaquinas() {
    const tbody = document.querySelector('#tabelaMaquinas tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    parqueMaquinas.forEach(m => {
        const tr = document.createElement('tr');
        const dtFmt = m.data_manutencao_preventiva ? m.data_manutencao_preventiva.substring(0,10) : 'N/A';
        // CORRIGIDO: Chaves mapeadas com precisao para casar com o RealDictCursor do Python
        const diam = m.diametro_trabalho_mm || 0;
        const comp = m.comprimento_trabalho_mm || 0;
        const custoMin = m.custo_minuto_maquina || 0;
        
        tr.innerHTML = `
            <td><strong>${m.nome_maquina}</strong></td>
            <td>Ø ${diam} x ${comp} mm</td>
            <td>${m.potencia_kw} kW</td>
            <td>${dtFmt}</td>
            <td>R$ ${parseFloat(custoMin).toFixed(4)}</td>
            <td>
                <button onclick="carregarAtivoParaEdicao(${m.id})" style="background:#3498db; color:white; border:none; padding:4px 8px; cursor:pointer; margin-right:5px;">Alterar</button>
                <button onclick="deletarAtivoServidor(${m.id})" style="background:#e74c3c; color:white; border:none; padding:4px 8px; cursor:pointer;">Deletar</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}



async function deletarAtivoServidor(id) {
    if (!confirm("Deseja excluir este equipamento permanentemente do PostgreSQL?")) return;
    const response = await fetch(`/api/maquinas/${id}`, { method: 'DELETE' });
    if (response.ok) {
        carregarMaquinasDoServidor();
        emitirAudioTexto("Ativo excluído.");
    }
}

function carregarAtivoParaEdicao(id) {
    const m = parqueMaquinas.find(item => item.id === id);
    if (!m) return;

    if(document.getElementById('maquinaIdOculto')) document.getElementById('maquinaIdOculto').value = m.id;
    if(document.getElementById('maquinaNome')) document.getElementById('maquinaNome').value = m.nome_maquina;
    if(document.getElementById('maquinaPreco')) document.getElementById('maquinaPreco').value = m.preco_compra;
    if(document.getElementById('maquinaVidaUtil')) document.getElementById('maquinaVidaUtil').value = m.tempo_vida_util_anos;
    if(document.getElementById('maquinaValorRevenda')) document.getElementById('maquinaValorRevenda').value = m.valor_revenda_estimado;
    if(document.getElementById('maquinaManutencao')) document.getElementById('maquinaManutencao').value = m.custo_manutencao_anual;
    if(document.getElementById('maquinaHorasAno')) document.getElementById('maquinaHorasAno').value = m.horas_ativas_ano;
    if(document.getElementById('maquinaPotencia')) document.getElementById('maquinaPotencia').value = m.potencia_kw;
    if(document.getElementById('maquinaTarifa')) document.getElementById('maquinaTarifa').value = m.tarifa_kwh;
    if(m.data_aquisicao && document.getElementById('maquinaAquisicao')) document.getElementById('maquinaAquisicao').value = m.data_aquisicao.substring(0,10);
    if(m.data_manutencao_preventiva && document.getElementById('maquinaPrev')) document.getElementById('maquinaPrev').value = m.data_manutencao_preventiva.substring(0,10);
    if(document.getElementById('maquinaDiametro')) document.getElementById('maquinaDiametro').value = m.diametro_trabalho_mm;
    if(document.getElementById('maquinaComprimento')) document.getElementById('maquinaComprimento').value = m.comprimento_trabalho_mm;

    const btnSalvar = document.getElementById('btnSalvarAtivo');
    if (btnSalvar) btnSalvar.innerText = "Salvar Alterações no Banco";
}

// ============================================================================
// 4. MÓDULO DE PROCESSOS, PCP E ROTEIROS (PÁGINA: processos.html)
// ============================================================================
async function carregarProcessosEAtivosFabrica() {
    const select = document.getElementById('procSelecaoMaquina');
    if (!select) return;
    
    select.innerHTML = '<option value="">-- Buscando ativos no banco... --</option>';
    const response = await fetch('/api/maquinas');
    
    if (response.ok) {
        parqueMaquinas = await response.json();
        select.innerHTML = '<option value="">-- Selecione uma máquina --</option>';
        parqueMaquinas.forEach(m => {
            const option = document.createElement('option');
            option.value = m.id;
            option.textContent = m.nome_maquina;
            select.appendChild(option);
        });
    }
    renderuzarTabelaProcessos();
}

function adicionarEtapaProcesso() {
    const maquinaId = document.getElementById('procSelecaoMaquina').value;
    const tempoOperacao = parseFloat(document.getElementById('procTempoOperacao').value) || 0;
    const tempoSetup = parseFloat(document.getElementById('procTempoSetup').value) || 0;
    const salarioBase = parseFloat(document.getElementById('procSalarioMod').value) || 0;
    const encargosPercentual = parseFloat(document.getElementById('procEncargosPercentual').value) || 0;
    const loteTamanho = parseInt(document.getElementById('procLoteTamanho').value) || 1;

    if (!maquinaId) { alert("Selecione um equipamento."); return; }
    const maquinaSelecionada = parqueMaquinas.find(m => m.id == maquinaId);
    
    const salarioComEncargos = salarioBase * (1 + (encargosPercentual / 100));
    const custoModMinuto = salarioComEncargos / (220 * 60);
    const tempoSetupRateado = tempoSetup / loteTamanho;

    const custoMin = parseFloat(maquinaSelecionada.custo_minuto_maquina || 0);
    const custoMaquinaEtapa = tempoOperacao * custoMin;
    const custoSetupEtapa = tempoSetupRateado * custoMin;
    const custoModEtapa = (tempoOperacao + tempoSetupRateado) * custoModMinuto;

    listaProcessos = JSON.parse(localStorage.getItem('listaProcessos')) || [];
    listaProcessos.push({
        id: Date.now(),
        maquinaNome: maquinaSelecionada.nome_maquina,
        tempoOperacao,
        tempoSetupRateado,
        custoMinutoMaquina: custoMin,
        custoModTotal: custoModEtapa,
        custoTotalEtapa: custoMaquinaEtapa + custoSetupEtapa + custoModEtapa
    });
    
    localStorage.setItem('listaProcessos', JSON.stringify(listaProcessos));
    renderuzarTabelaProcessos();
}




function renderuzarTabelaProcessos() {
    const tbody = document.querySelector('#tabelaProcessos tbody');
    if (!tbody) return;
    
    listaProcessos = JSON.parse(localStorage.getItem('listaProcessos')) || [];
    tbody.innerHTML = '';
    let total = 0;

    listaProcessos.forEach(p => {
        total += p.custoTotalEtapa;
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${p.maquinaNome}</td>
            <td>${p.tempoOperacao} Min</td>
            <td>R$ ${p.custoMinutoMaquina.toFixed(4)}</td>
            <td>${p.tempoSetupRateado.toFixed(2)} Min</td>
            <td>R$ ${p.custoModTotal.toFixed(2)}</td>
            <td><strong>R$ ${p.custoTotalEtapa.toFixed(2)}</strong></td>
            <td><button onclick="removerProcesso(${p.id})" style="background:#e74c3c; color:white; border:none; padding:4px 8px; cursor:pointer;">X</button></td>
        `;
        tbody.appendChild(tr);
    });
    
    if(document.getElementById('totalProcessoCusto')) document.getElementById('totalProcessoCusto').innerText = total.toFixed(2);
    localStorage.setItem('custoTotalProcessos', total.toString());
}

function removerProcesso(id) {
    listaProcessos = JSON.parse(localStorage.getItem('listaProcessos')) || [];
    listaProcessos = listaProcessos.filter(p => p.id !== id);
    localStorage.setItem('listaProcessos', JSON.stringify(listaProcessos));
    renderuzarTabelaProcessos();
}

function adicionarInsumo() {
    const nome = document.getElementById('insumoNome').value.trim();
    const qtd = parseFloat(document.getElementById('insumoQtd').value) || 0;
    const custoUn = parseFloat(document.getElementById('insumoCustoUn').value) || 0;
    if (!nome || qtd <= 0 || custoUn <= 0) return;

    listaInsumos = JSON.parse(localStorage.getItem('listaInsumos')) || [];
    listaInsumos.push({ id: Date.now(), nome, qtd, custoUn, subtotal: qtd * custoUn });
    localStorage.setItem('listaInsumos', JSON.stringify(listaInsumos));
    renderizarTabelaInsumos();
    
    document.getElementById('insumoNome').value = '';
    document.getElementById('insumoQtd').value = '';
    document.getElementById('insumoCustoUn').value = '';
}

function renderizarTabelaInsumos() {
    const tbody = document.querySelector('#tabelaInsumos tbody');
    if (!tbody) return;
    
    listaInsumos = JSON.parse(localStorage.getItem('listaInsumos')) || [];
    tbody.innerHTML = '';
    let total = 0;
    
    listaInsumos.forEach(item => {
        total += item.subtotal;
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${item.nome}</td><td>${item.qtd}</td><td>R$ ${item.custoUn.toFixed(2)}</td><td>R$ ${item.subtotal.toFixed(2)}</td><td><button onclick="removerInsumo(${item.id})" style="background:#e74c3c; color:white; border:none; padding:4px 8px; cursor:pointer;">X</button></td>`;
        tbody.appendChild(tr);
    });
    
    document.getElementById('totalMaterialCusto').innerText = total.toFixed(2);
    localStorage.setItem('custoTotalInsumos', total.toString());
}

function removerInsumo(id) {
    listaInsumos = JSON.parse(localStorage.getItem('listaInsumos')) || [];
    listaInsumos = listaInsumos.filter(i => i.id !== id);
    localStorage.setItem('listaInsumos', JSON.stringify(listaInsumos));
    renderizarTabelaInsumos();
}

function carregarEMotorCustoGlobal() {
    const campoCustoTotalInput = document.getElementById('custoTotal');
    if (!campoCustoTotalInput) return;

    const totalProcessos = parseFloat(localStorage.getItem('custoTotalProcessos')) || 0;
    const totalInsumos = parseFloat(localStorage.getItem('custoTotalInsumos')) || 0;
    const custoMinutoImobiliario = parseFloat(localStorage.getItem('custoMinutoImobiliario')) || 0;
    
    let rotas = JSON.parse(localStorage.getItem('listaProcessos')) || [];
    let tempoTotalMinutos = 0;
    rotas.forEach(p => { tempoTotalMinutos += (p.tempoOperacao + p.tempoSetupRateado); });

    const rateioImobiliario = tempoTotalMinutos * custoMinutoImobiliario;
    let custoIndustrialAcumulado = totalProcessos + totalInsumos + rateioImobiliario;
    
    if (custoIndustrialAcumulado === 0 && totalInsumos > 0) {
        custoIndustrialAcumulado = totalInsumos;
    }
    campoCustoTotalInput.value = custoIndustrialAcumulado.toFixed(2);
}

function ajustarMargemPorCanal() {
    const canal = document.getElementById('canalPreco').value;
    document.getElementById('lucro').value = canal === 'atacado' ? "15" : "25";
}

async function calcularPrecovenda() {
    const custo_total = document.getElementById('custoTotal').value;
    const margem_lucro = document.getElementById('lucro').value;
    const impostos = document.getElementById('impostosInput').value;

    const response = await fetch('/api/calculo-markup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ custo_total, margem_lucro, impostos })
    });

    if (response.ok) {
        const data = await response.json();
        localStorage.setItem('lucroPorPecaGlobal', (data.preco_venda - parseFloat(custo_total)).toString());
        document.getElementById('resultado').innerHTML = `<p style='font-weight:bold; color:#16a085;'>Preço Final Sugerido pela Consultoria: R$ ${data.preco_venda}</p>`;
        document.getElementById('resultado').style.display = 'block';
    }
}

function calcularTempoRetorno() {
    const volumeVendasMensal = parseInt(document.getElementById('retVendasMensais').value) || 0;
    const despesasAdministrativas = parseFloat(document.getElementById('retDespesasFixas').value) || 0;
    const investimentoImobiliario = parseFloat(localStorage.getItem('totalInvestidoEstrutura')) || 0;
    
    let totalPrecoMaquinas = parqueMaquinas.reduce((acc, curr) => acc + parseFloat(curr.preco_compra || 0), 0);
    const investimentoTotalInicial = investimentoImobiliario + totalPrecoMaquinas;
    const lucroPorPecaGlobal = parseFloat(localStorage.getItem('lucroPorPecaGlobal')) || 0;

    const box = document.getElementById('resultadoRetorno');
    if (!box) return;
    box.style.display = "block";

    if (investimentoTotalInicial <= 0 || lucroPorPecaGlobal <= 0) return;
    const lucroLiquidoMensal = (volumeVendasMensal * lucroPorPecaGlobal) - despesasAdministrativas;
    
    if (lucroLiquidoMensal <= 0) { box.innerHTML = "Lucro insuficiente."; return; }
    box.innerHTML = `<p>Retorno total em aproximadamente ${(investimentoTotalInicial / lucroLiquidoMensal).toFixed(1)} meses de operação.</p>`;
}
