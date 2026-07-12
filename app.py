import os
import psycopg2
from psycopg2.extras import RealDictCursor
from flask import Flask, render_template, jsonify, request

app = Flask(__name__)

def obter_conexao_db():
    url_banco = os.environ.get('DATABASE_URL')
    if url_banco:
        if url_banco.startswith("postgres://"):
            url_banco = url_banco.replace("postgres://", "postgresql://", 1)
        return psycopg2.connect(url_banco)
    return None

def inicializar_banco():
    conn = obter_conexao_db()
    if conn:
        try:
            cursor = conn.cursor()
            if os.path.exists('schema.sql'):
                with open('schema.sql', 'r', encoding='utf-8') as f:
                    cursor.execute(f.read())
                conn.commit()
            cursor.close()
            conn.close()
        except Exception as e:
            print(f"Erro no banco: {e}")

inicializar_banco()

@app.route('/')
def index(): return render_template('index.html')

@app.route('/terreno')
def pagina_terreno(): return render_template('terreno.html')

@app.route('/maquinas')
def pagina_maquinas(): return render_template('maquinas.html')

@app.route('/processos')
def pagina_processos(): return render_template('processos.html')

@app.route('/materiais')
def pagina_materiais(): return render_template('materiais.html')

@app.route('/precificacao')
def pagina_precificacao(): return render_template('precificacao.html')

@app.route('/retorno')
def pagina_retorno(): return render_template('retorno.html')

@app.route('/api/imobiliario', methods=['POST'])
def salvar_imobiliario():
    data = request.get_json()
    valor_terreno = float(data.get('valor_terreno', 0))
    custo_edificacao = float(data.get('custo_edificacao', 0))
    impostos_anuais = float(data.get('impostos_anuais', 0))
    vida_util_anos = int(data.get('vida_util_anos', 20))
    horas_operacionais_ano = int(data.get('horas_operacionais_ano', 2400))

    amortizacao_anual = (valor_terreno + custo_edificacao) / vida_util_anos
    custo_imobiliario_anual = amortizacao_anual + impostos_anuais
    minutos_ano = horas_operacionais_ano * 60
    custo_minuto_instalacao = custo_imobiliario_anual / minutos_ano if minutos_ano > 0 else 0

    conn = obter_conexao_db()
    if conn:
        try:
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO investimentos_iniciais (valor_terreno, custo_edificacao, impostos_transferencia) VALUES (%s, %s, %s);",
                (valor_terreno, custo_edificacao, impostos_anuais)
            )
            conn.commit()
            cursor.close()
            conn.close()
        except Exception as e: return jsonify({'error': str(e)}), 500

    return jsonify({
        'status': 'sucesso',
        'amortizacaoAnual': round(amortizacao_anual, 2),
        'custoAnualTotal': round(custo_imobiliario_anual, 2),
        'custoMinutoInstalacao': round(custo_minuto_instalacao, 4)
    })
@app.route('/api/maquinas', methods=['GET', 'POST', 'PUT'])
def gerenciar_maquinas():
    conn = obter_conexao_db()
    if not conn: return jsonify([])
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    if request.method in ['POST', 'PUT']:
        data = request.get_json()
        id_maquina = data.get('id')
        nome = data.get('nome')
        preco = float(data.get('preco', 0))
        vida_util = int(data.get('vida_util', 1))
        valor_revenda = float(data.get('valor_revenda', 0))
        manutencao = float(data.get('manutencao', 0))
        horas_ano = int(data.get('horas_ano', 1))
        potencia = float(data.get('potencia_kw', 0))
        tarifa = float(data.get('tarifa_kwh', 0))
        
        # BLINDAGEM DE SINAL: Previne depreciação negativa se valor de revenda for maior
        if valor_revenda > preco:
            depreciacao_anual = 0
        else:
            depreciacao_anual = (preco - valor_revenda) / vida_util
            
        custo_fixo_anual = depreciacao_anual + manutencao
        minutos_ano = horas_ano * 60
        
        # Custo do Minuto Fixo + Custo do Minuto de Energia Elétrica (kW * Tarifa / 60 minutos)
        custo_energia_minuto = (potencia * tarifa) / 60.0
        custo_minuto = (custo_fixo_anual / minutos_ano) + custo_energia_minuto

        try:
            if request.method == 'PUT' and id_maquina:
                cursor.execute(
                    """UPDATE maquinas SET nome_maquina=%s, preco_compra=%s, tempo_vida_util_anos=%s, 
                                          valor_revenda_estimado=%s, custo_manutencao_anual=%s, 
                                          horas_ativas_ano=%s, potencia_kw=%s, tarifa_kwh=%s, custo_minuto_maquina=%s 
                       WHERE id=%s;""",
                    (nome, preco, vida_util, valor_revenda, manutencao, horas_ano, potencia, tarifa, custo_minuto, id_maquina)
                )
            else:
                cursor.execute(
                    """INSERT INTO maquinas (nome_maquina, preco_compra, tempo_vida_util_anos, valor_revenda_estimado, 
                                            custo_manutencao_anual, horas_ativas_ano, potencia_kw, tarifa_kwh, custo_minuto_maquina) 
                       VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s);""",
                    (nome, preco, vida_util, valor_revenda, manutencao, horas_ano, potencia, tarifa, custo_minuto)
                )
            conn.commit()
            cursor.close()
            conn.close()
            return jsonify({'status': 'sucesso', 'custoMinuto': round(custo_minuto, 4)})
        except Exception as e: return jsonify({'error': str(e)}), 500

    cursor.execute("SELECT * FROM maquinas ORDER BY id DESC;")
    maquinas = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(maquinas)

@app.route('/api/calculo-markup', methods=['POST'])
def calcular_markup():
    data = request.get_json()
    custo_total = float(data.get('custo_total', 0))
    margem_lucro = float(data.get('margem_lucro', 0))
    impostos = float(data.get('impostos', 0))
    denominador = 1 - ((margem_lucro + impostos) / 100)
    if denominador <= 0: return jsonify({'error': 'Erro'}), 400
    return jsonify({'markup': round(1/denominador, 2), 'preco_venda': round(custo_total * (1/denominador), 2)})

@app.route('/api/holerite/<int:funcionario_id>/<int:mes>/<int:ano>', methods=['GET'])
def gerar_holerite(funcionario_id, mes, ano):
    return jsonify({'status': 'funcional'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))
