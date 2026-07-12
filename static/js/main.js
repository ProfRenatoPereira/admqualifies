let parqueMaquinas = [];
let listaProcessos = [];
let listaInsumos = [];
let custoMinutoImobiliarioGlobal = 0;
let totalInvestidoEstrutura = 0;
let totalInvestidoMaquinas = 0;
let lucroPorPecaGlobal = 0;

document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.getElementById('menuToggle');
    const navMenu = document.getElementById('navMenu');

    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', () => {
            const expandido = menuToggle.getAttribute('aria-expanded') === 'true';
            menuToggle.setAttribute('aria-expanded', !expandido);
            navMenu.classList.toggle('active');
        });
    }

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

    if (document.getElementById('tabelaMaquinas')) carregarMaquinasDoServidor();
    if (document.getElementById('procSelecaoMaquina')) atualizarSelectMaquinas();
    if (document.getElementById('tabelaProcessos')) renderizarTabelaProcessos();
    if (document.getElementById('tabelaInsumos')) renderizarTabelaInsumos();
    if (document.getElementById('custoTotal')) carregarEMotorCustoGlobal();
});

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
// 2. MÓDULO IMOBILIÁRIO & ATIVOS COM ENERGIA ELÉTRICA (VERSÃO CORRIGIDA E BLINDADA)
// ============================================================================
async function calcularCustosImobiliarios() {
    const valor_terreno = parseFloat(document.getElementById('imoTerreno').value) || 0;
    const custo_edificacao = parseFloat(document.getElementById('imoEdificacao').value) || 0;
    const vida_util_anos = parseInt(document.getElementById('imoVidaUtil').value) || 1;
    const impostos_anuais = parseFloat(document.getElementById('imoImpostos').value) || 0;
    const horas_operacionais_ano = parseInt(document.getElementById('imoHorasAno').value) || 1;

    if (valor_terreno <= 0 || custo_edificacao <= 0) {
        alert("Preencha os valores imobiliários.");
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
        emitirAudioTexto("Custos imobiliários salvos.");
    }
}

async function carregarMaquinasDoServidor() {
    const response = await fetch('/api/maquinas');
    if (response.ok) {
        parqueMaquinas = await response.json();
        renderizarTabelaMaquinas();
    }
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

    // Se os campos base não existirem nesta tela, cancela a operação silenciosamente para não quebrar o ERP
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

    if (!nome || preco <= 0) { 
        alert("Preencha os dados do ativo."); 
        return; 
    }

    const metodo = id_maquina ? 'PUT' : 'POST';

    // CORREÇÃO DA LINHA 141: Ajustado de 'horas_ano: horas_ano' para usar a variável correta 'horas_ano: horasAno'
    const response = await fetch('/api/maquinas', {
        method: metodo,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            id: id_maquina, 
            nome: nome, 
            preco: preco, 
            vida_util: vidaUtil, 
            valor_revenda: valorRevenda, 
            manutencao: manutencao, 
            horas_ano: horasAno, // Corrigido!
            potencia_kw: potencia_kw, 
            tarifa_kwh: tarifa_kwh 
        })
    });

    if (response.ok) {
        if (elId) elId.value = '';
        const btnSalvar = document.getElementById('btnSalvarAtivo');
        if (btnSalvar) btnSalvar.innerText = "Salvar e Registrar Ativo";
        carregarMaquinasDoServidor();
        emitirAudioTexto("Equipamento processado e salvo de forma estável.");
    }
}

function renderizarTabelaMaquinas() {
    const tbody = document.querySelector('#tabelaMaquinas tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    parqueMaquinas.forEach(m => {
        const tr = document.createElement('tr');
        const custoAnualExibir = m.custo_manutencao_anual || m.custoFixoAnual || 0;
        
        tr.innerHTML = `
            <td>${m.nome_maquina || m.nome}</td>
            <td>${m.potencia_kw || 0} kW</td>
            <td>R$ ${parseFloat(custoAnualExibir).toFixed(2)}</td>
            <td>R$ ${parseFloat(m.custo_minuto_maquina || m.custoMinuto).toFixed(4)}</td>
            <td><button onclick="carregarAtivoParaEdicao(${m.id})" style="background:#3498db; color:white; border:none; padding:4px 8px; cursor:pointer; margin-right:5px;">Editar</button></td>
        `;
        tbody.appendChild(tr);
    });
}

function carregarAtivoParaEdicao(id) {
    const m = parqueMaquinas.find(item => item.id === id);
    if (!m) return;

    if (document.getElementById('maquinaIdOculto')) document.getElementById('maquinaIdOculto').value = m.id;
    if (document.getElementById('maquinaNome')) document.getElementById('maquinaNome').value = m.nome_maquina;
    if (document.getElementById('maquinaPreco')) document.getElementById('maquinaPreco').value = m.preco_compra;
    if (document.getElementById('maquinaVidaUtil')) document.getElementById('maquinaVidaUtil').value = m.tempo_vida_util_anos;
    if (document.getElementById('maquinaValorRevenda')) document.getElementById('maquinaValorRevenda').value = m.valor_revenda_estimado;
    if (document.getElementById('maquinaManutencao')) document.getElementById('maquinaManutencao').value = m.custo_manutencao_anual;
    if (document.getElementById('maquinaHorasAno')) document.getElementById('maquinaHorasAno').value = m.horas_ativas_ano;
    if (document.getElementById('maquinaPotencia')) document.getElementById('maquinaPotencia').value = m.potencia_kw;
    if (document.getElementById('maquinaTarifa')) document.getElementById('maquinaTarifa').value = m.tarifa_kwh;

    const btnSalvar = document.getElementById('btnSalvarAtivo');
    if (btnSalvar) btnSalvar.innerText = "Salvar Alterações no Banco";
    emitirAudioTexto("Ativo carregado para modificação.");
}





// ============================================================================
// 3. ENGENHARIA DE PROCESSOS & MÃO DE OBRA
// ============================================================================
async function atualizarSelectMaquinas() {
    const select = document.getElementById('procSelecaoMaquina');
    if (!select) return;
    
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
}

function adicionarEtapaProcesso() {
    const maquinaId = document.getElementById('procSelecaoMaquina').value;
    const tempoOperacao = parseFloat(document.getElementById('procTempoOperacao').value) || 0;
    const tempoSetup = parseFloat(document.getElementById('procTempoSetup').value) || 0;
    const salarioBase = parseFloat(document.getElementById('procSalarioMod').value) || 0;
    const encargosPercentual = parseFloat(document.getElementById('procEncargosPercentual').value) || 0;
    const loteTamanho = parseInt(document.getElementById('procLoteTamanho').value) || 1;

    if (!maquinaId) { alert("Selecione uma máquina."); return; }

    const maquinaSelecionada = parqueMaquinas.find(m => m.id == maquinaId);
    const salarioComEncargos = salarioBase * (1 + (encargosPercentual / 100));
    const custoModMinuto = salarioComEncargos / (220 * 60);

    const tempoSetupRateado = tempoSetup / loteTamanho;
    const tempoTotalAlocadoPorPeca = tempoOperacao + tempoSetupRateado;

    const custoMin = parseFloat(maquinaSelecionada.custo_minuto_maquina || maquinaSelecionada.custoMinuto);
    const custoMaquinaEtapa = tempoOperacao * custoMin;
    const custoSetupEtapa = tempoSetupRateado * custoMin;
    const custoModEtapa = tempoTotalAlocadoPorPeca * custoModMinuto;

    let rotas = JSON.parse(localStorage.getItem('listaProcessos')) || [];
    rotas.push({
        id: Date.now(),
        maquinaNome: maquinaSelecionada.nome_maquina,
        tempoOperacao,
        tempoSetupRateado,
        custoMinutoMaquina: custoMin,
        custoModTotal: custoModEtapa,
        custoTotalEtapa: custoMaquinaEtapa + custoSetupEtapa + custoModEtapa
    });

    localStorage.setItem('listaProcessos', JSON.stringify(rotas));
    renderizarTabelaProcessos();
}

function renderizarTabelaProcessos() {
    const tbody = document.querySelector('#tabelaProcessos tbody');
    if (!tbody) return;
    let rotas = JSON.parse(localStorage.getItem('listaProcessos')) || [];
    tbody.innerHTML = '';
    let total = 0;

    rotas.forEach(p => {
        total += p.custoTotalEtapa;
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${p.maquinaNome}</td><td>${p.tempoOperacao}</td><td>R$ ${p.custoMinutoMaquina.toFixed(4)}</td><td>${p.tempoSetupRateado.toFixed(2)}</td><td>R$ ${p.custoModTotal.toFixed(2)}</td><td><strong>R$ ${p.custoTotalEtapa.toFixed(2)}</strong></td><td><button onclick="removerProcesso(${p.id})">X</button></td>`;
        tbody.appendChild(tr);
    });
    document.getElementById('totalProcessoCusto').innerText = total.toFixed(2);
    localStorage.setItem('custoTotalProcessos', total.toString());
}

function removerProcesso(id) {
    let rotas = JSON.parse(localStorage.getItem('listaProcessos')) || [];
    rotas = rotas.filter(p => p.id !== id);
    localStorage.setItem('listaProcessos', JSON.stringify(rotas));
    renderizarTabelaProcessos();
}



// ============================================================================
// 4. MATERIAIS, MARK-UP E METRICAS DE VIABILIDADE
// ============================================================================
function adicionarInsumo() {
    const nome = document.getElementById('insumoNome').value.trim();
    const qtd = parseFloat(document.getElementById('insumoQtd').value) || 0;
    const custoUn = parseFloat(document.getElementById('insumoCustoUn').value) || 0;
    if (!nome || qtd <= 0 || custoUn <= 0) return;

    let insumos = JSON.parse(localStorage.getItem('listaInsumos')) || [];
    insumos.push({ id: Date.now(), nome, qtd, custoUn, subtotal: qtd * custoUn });
    localStorage.setItem('listaInsumos', JSON.stringify(insumos));
    renderizarTabelaInsumos();
}

function renderizarTabelaInsumos() {
    const tbody = document.querySelector('#tabelaInsumos tbody');
    if (!tbody) return;
    let insumos = JSON.parse(localStorage.getItem('listaInsumos')) || [];
    tbody.innerHTML = '';
    let total = 0;

    insumos.forEach(item => {
        total += item.subtotal;
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${item.nome}</td><td>${item.qtd}</td><td>R$ ${item.custoUn.toFixed(2)}</td><td>R$ ${item.subtotal.toFixed(2)}</td><td><button onclick="removerInsumo(${item.id})">X</button></td>`;
        tbody.appendChild(tr);
    });
    document.getElementById('totalMaterialCusto').innerText = total.toFixed(2);
    localStorage.setItem('custoTotalInsumos', total.toString());
    carregarEMotorCustoGlobal();
}

function removerInsumo(id) {
    let insumos = JSON.parse(localStorage.getItem('listaInsumos')) || [];
    insumos = insumos.filter(i => i.id !== id);
    localStorage.setItem('listaInsumos', JSON.stringify(insumos));
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
    
    if (custoIndustrialAcumulado === 0) {
        const totalMaterialTexto = document.getElementById('totalMaterialCusto');
        if (totalMaterialTexto) custoIndustrialAcumulado = parseFloat(totalMaterialTexto.innerText) || 0;
    }
    campoCustoTotalInput.value = custoIndustrialAcumulado.toFixed(2);
}

function ajustarMargemPorCanal() {
    const canal = document.getElementById('canalPreco').value;
    const campoLucro = document.getElementById('lucro');
    campoLucro.value = canal === 'atacado' ? "15" : "25";
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
        let margemGanhoPeca = data.preco_venda - parseFloat(custo_total);
        localStorage.setItem('lucroPorPecaGlobal', margemGanhoPeca.toString());
        document.getElementById('resultado').innerHTML = `<p>Preço Gerado: R$ ${data.preco_venda}</p>`;
        document.getElementById('resultado').style.display = 'block';
    }
}

function calcularTempoRetorno() {
    const volumeVendasMensal = parseInt(document.getElementById('retVendasMensais').value) || 0;
    const despesasAdministrativas = parseFloat(document.getElementById('retDespesasFixas').value) || 0;
    
    const investimentoImobiliario = parseFloat(localStorage.getItem('totalInvestidoEstrutura')) || 0;
    
    // Soma o valor de compra real das máquinas salvas do banco
    let totalPrecoMaquinas = parqueMaquinas.reduce((acc, curr) => acc + parseFloat(curr.preco_compra || 0), 0);
    const investimentoTotalInicial = investimentoImobiliario + totalPrecoMaquinas;
    
    const lucroPorPecaGlobal = parseFloat(localStorage.getItem('lucroPorPecaGlobal')) || 0;

    if (investimentoTotalInicial <= 0 || lucroPorPecaGlobal <= 0) { alert("Preencha os ativos primeiro."); return; }

    const lucroLiquidoMensal = (volumeVendasMensal * lucroPorPecaGlobal) - despesasAdministrativas;
    const box = document.getElementById('resultadoRetorno');
    box.style.display = "block";

    if (lucroLiquidoMensal <= 0) { box.innerHTML = "<span style='color:red;'>Lucro operacional insuficiente.</span>"; return; }

    const meses = investimentoTotalInicial / lucroLiquidoMensal;
    box.innerHTML = `<p>Investimento de R$ ${investimentoTotalInicial.toFixed(2)} retornará em ${meses.toFixed(1)} meses.</p>`;
}


