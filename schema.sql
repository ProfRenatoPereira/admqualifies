-- Estrutura de Tabelas Industriais - TERCEIRO ADM ASSOCIADOS
CREATE TABLE IF NOT EXISTS cargos (
    id SERIAL PRIMARY KEY,
    nome_cargo VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS funcionarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    data_admissao DATE NOT NULL,
    cargo_id INT REFERENCES cargos(id),
    salario_base NUMERIC(10,2) NOT NULL,
    departamento VARCHAR(100) NOT NULL,
    horas_contratuais INT DEFAULT 220,
    regime_he VARCHAR(20) DEFAULT 'pagar',
    turno VARCHAR(20) DEFAULT 'diurno',
    hora_entrada TIME DEFAULT '08:00:00',
    he_semana INT DEFAULT 0,
    he_sabado INT DEFAULT 0,
    he_domingo INT DEFAULT 0,
    beneficios NUMERIC(10,2) DEFAULT 0.00,
    qtd_filhos INT DEFAULT 0,
    plano_saude NUMERIC(10,2) DEFAULT 0.00,
    plano_odonto NUMERIC(10,2) DEFAULT 0.00,
    vale_farmacia NUMERIC(10,2) DEFAULT 0.00,
    sindicato NUMERIC(10,2) DEFAULT 0.00,
    adiantamento VARCHAR(5) DEFAULT 'nao',
    vt_desconto VARCHAR(5) DEFAULT 'nao',
    observacoes TEXT,
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS investimentos_iniciais (
    id SERIAL PRIMARY KEY,
    descricao_terreno VARCHAR(255) DEFAULT 'Galpão Industrial Metalúrgico',
    valor_terreno NUMERIC(12,2) NOT NULL,
    custo_edificacao NUMERIC(12,2) NOT NULL,
    impostos_transferencia NUMERIC(12,2) NOT NULL,
    data_aquisicao DATE DEFAULT CURRENT_DATE
);

-- Tabela de Máquinas expandida com Engenharia de Energia Elétrica
CREATE TABLE IF NOT EXISTS maquinas (
    id SERIAL PRIMARY KEY,
    nome_maquina VARCHAR(100) NOT NULL,
    preco_compra NUMERIC(12,2) NOT NULL,
    tempo_vida_util_anos INT NOT NULL,
    valor_revenda_estimado NUMERIC(12,2) NOT NULL,
    custo_manutencao_anual NUMERIC(12,2) NOT NULL,
    horas_ativas_ano INT NOT NULL,
    potencia_kw NUMERIC(8,2) DEFAULT 0.00,
    tarifa_kwh NUMERIC(6,4) DEFAULT 0.0000,
    custo_minuto_maquina NUMERIC(10,4) NOT NULL
);

CREATE TABLE IF NOT EXISTS registro_horas_extras (
    id SERIAL PRIMARY KEY,
    funcionario_id INT REFERENCES funcionarios(id) ON DELETE CASCADE,
    data_registro DATE NOT NULL,
    mes_referencia INT NOT NULL,
    ano_referencia INT NOT NULL,
    qtd_horas NUMERIC(5,2) NOT NULL,
    tipo_dia VARCHAR(20) NOT NULL,
    eh_noturna BOOLEAN DEFAULT FALSE,
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
