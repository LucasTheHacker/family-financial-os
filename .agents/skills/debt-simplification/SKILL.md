---
name: debt-simplification-algorithm
description: "Understand, verify, and run the debt crossing/simplification algorithm of the application."
---

# Algoritmo de Simplificação de Dívidas

Este skill descreve as regras do algoritmo de acerto de contas (`calculate_settlements`) localizado em `backend/app/services/debt_simplification.py`.

## Fluxo de Execução

1. **Obtenção das Despesas:**
   Busca todas as despesas vinculadas ao `billing_cycle` (formato `YYYY-MM`) solicitado.
   
2. **Cálculo de Balanços Individuais:**
   - **Pago (`total_paid`):** Soma dos valores das despesas criadas onde o usuário é o `payer_id`.
   - **Consumido (`total_consumed`):** Soma das parcelas individuais calculadas com base nas participações (`participations`). 
     - Para despesas divididas igualmente, o valor de consumo é `total_amount / total_participantes`.
     - Para despesas com pesos personalizados, o valor de consumo é proporcional ao peso do participante.
     - Para despesas com valores personalizados, o valor é explicitamente o alocado para aquele participante.
   - **Balanço Líquido (`net_balance`):** `total_paid - total_consumed`.
     - Se `net_balance > 0`: O usuário é um **credor** (deve receber dinheiro).
     - Se `net_balance < 0`: O usuário é um **devedor** (deve pagar dinheiro).

3. **Resolução de Dívidas (Crossing):**
   - Cria uma lista de devedores (ordenados de quem deve mais a quem deve menos) e credores (ordenados de quem deve receber mais a quem deve receber menos).
   - Utiliza uma abordagem gananciosa de dois ponteiros:
     - O maior devedor transfere o máximo possível para pagar o maior credor.
     - Atualiza os saldos de ambos.
     - O processo se repete até que todos os saldos sejam zerados.

## Validação e Testes
Sempre que fizer alterações no fluxo de cálculo ou nos modelos relacionados a despesas e participações, execute:
```powershell
.\venv\Scripts\pytest backend/tests/test_settlements.py
```
Isso garante que o algoritmo continua simplificando as dívidas de forma correta e sem loops.
