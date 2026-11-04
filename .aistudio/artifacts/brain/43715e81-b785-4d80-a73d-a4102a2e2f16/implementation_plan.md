# Gestor de Base FC - Controle e Avaliação de Atletas

Aplicativo profissional de gestão e monitoramento para comissões técnicas de categorias de base de futebol masculino, permitindo o gerenciamento de atletas nas categorias Sub-15, Sub-16 e Sub-17, avaliações estruturadas pós-jogo com notas de 1 a 10 em 5 pilares essenciais (Técnica, Tática, Física, Mental e Disciplinar), gráficos radar de evolução e geração de relatórios individuais para acompanhamento da temporada.

### User Review & Critical Decisions

> [!IMPORTANT]
> **Decisões alinhadas para o projeto:**
> - **Categorias Oficiais**: Sub-15 (ajustando a digitação "Sub 156"), Sub-16 e Sub-17, com flexibilidade para adicionar ou renomear categorias caso o clube necessite no futuro.
> - **Sistema de Avaliação**: Escala quantitativa de 1 a 10 para cada uma das 5 dimensões solicitadas (Técnica, Tática, Física, Mental e Disciplinar), acompanhada de campo livre para observações do progresso e desenvolvimento.
> - **Relatórios e Análise**: Ficha técnica individual completa por atleta com gráfico radar dos 5 pilares, histórico de partidas, evolução média ao longo da temporada, notas destacadas e ferramenta pronta para exportação/impressão em PDF e backup em planilha/JSON.
> - **Persistência de Dados**: Armazenamento local seguro no navegador (`localStorage`) com dados pré-carregados para demonstração imediata e funções de exportação/importação para garantir que os dados não sejam perdidos.

---

### 1. Overview & Core Concept

- **O que o aplicativo faz**: Permite que o treinador, coordenador ou comissão técnica organize os atletas por categoria de base, cadastre fichas detalhadas (posição, número, data de nascimento, pé dominante, histórico físico), registre avaliações jogo a jogo com notas e pareceres detalhados, e acompanhe o crescimento técnico-comportamental de cada jovem talento por meio de métricas visuais e relatórios de temporada.
- **Público-alvo**: Treinadores, preparadores físicos, scouts e coordenadores de futebol de base.
- **Valor central**: Eliminar anotações em papel e planilhas dispersas, consolidando um histórico confiável e profissional de cada atleta que auxilia na tomada de decisão (titularidade, renovação, transição de categoria e formação integral).

---

### 2. User Experience & Visual Design

#### Fluxos Principais do Usuário
1. **Painel Geral & Seleção de Categoria**: Visualização rápida do contingente de atletas em cada categoria (Sub-15, Sub-16, Sub-17), médias gerais da equipe nos 5 pilares e últimas avaliações cadastradas.
2. **Plantel / Gestão de Atletas**:
   - Listagem com filtro rápido por categoria, posição de campo (Goleiro, Zagueiro, Lateral, Volante, Meia, Atacante) e busca por nome.
   - Cadastro e edição de atleta com foto/avatar, dados pessoais, perna preferida e status (Ativo, Departamento Médico, Transição).
3. **Registro de Avaliação de Jogo**:
   - Seleção do atleta, identificação da partida (adversário, data, tipo de jogo: Amistoso/Campeonato, minutagem jogada).
   - Sliders táteis intuitivos de 1 a 10 para cada pilar:
     - **Técnica** (passe, controle, finalização, drible)
     - **Tática** (posicionamento, tomada de decisão, recomposição, ocupação de espaço)
     - **Física** (velocidade, resistência, intensidade, força nos duelos)
     - **Mental** (foco, resiliência, liderança, reação sob pressão)
     - **Disciplinar** (comprometimento, respeito à arbitragem/colegas, pontualidade)
   - Campo rico de **Observações de Desenvolvimento** para anotações qualitativas.
4. **Ficha Individual & Relatório de Temporada**:
   - Gráfico Radar (Pentágono de Atributos) comparando a média do jogador com metas de referência.
   - Linha do tempo de partidas avaliadas.
   - Histórico das observações da comissão técnica.
   - Botão de **Exportar Relatório Individual (PDF / Impressão)** formatado para reuniões com pais, diretoria ou comissão.

#### Identidade Visual & Design
- **Direção Estética**: Moderno, esportivo e técnico — inspirado em centros de inteligência e scouting de clubes de futebol (HUD limpo, dados legíveis, alto contraste).
- **Paleta de Cores**:
  - Base: Tons neutros esportivos escuros e claros equilibrados (grafite ardósia `#0F172A`, superfícies `#1E293B` ou branco nítido `#FFFFFF` em modo claro).
  - Acentos de Destaque: Verde gramado tático (`#16A34A` / `#22C55E`) para destaques e notas altas, âmbar para atenção intermediária e azul cobalto para elementos interativos.
- **Tipografia**: `Plus Jakarta Sans` para títulos e botões, combinada com números tabulares alinhados (`tabular-nums`) para todas as notas e estatísticas.
- **Controle de Interface**: Segue as diretrizes anti-slop — sem botões redundantes, metadados limpos com separadores tipográficos e sem badges desnecessárias.

---

### 3. Principais Decisões & Arquitetura de Produto

1. **Estrutura por Categorias Pré-definidas com Expansão**:
   - *Decisão*: Sub-15, Sub-16 e Sub-17 vêm prontas de fábrica, com badge de categoria ativa no seletor e suporte dinâmico a novas categorias.
   - *Motivo*: Facilita o uso imediato sem demandar configurações complexas iniciais.
2. **Avaliação dos 5 Pilares Fundamentais (Técnica, Tática, Física, Mental, Disciplinar)**:
   - *Decisão*: Escala de 1 a 10 com médias ponderadas automáticas e radar chart interativo em SVG puro (sem dependências externas pesadas que poderiam falhar na compilação).
   - *Motivo*: Oferece clareza imediata para o atleta e comissão sobre forças e pontos a desenvolver.
3. **Persistência Segura e Exportação**:
   - *Decisão*: LocalStorage com sementeira inicial de atletas de exemplo (para o usuário experimentar o sistema assim que abrir), com botões para "Exportar Backup JSON", "Baixar Dados em CSV" e "Restaurar Backup".
   - *Motivo*: Autonomia total, sem necessidade de servidores de banco de dados externos ou logins para uso próprio.
4. **Relatório de Impressão Direto**:
   - *Decisão*: Folha de estilo de impressão (`@media print`) limpa e otimizada que gera uma ficha A4 profissional pronta para arquivamento ou envio em PDF pelo próprio navegador.

---

### 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                              App.tsx                                   │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Navigation Header: Categorias (Sub-15, Sub-16, Sub-17) & Visões  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                    │                                   │
│         ┌──────────────────────────┼─────────────────────────┐         │
│         ▼                          ▼                         ▼         │
│  ┌──────────────┐          ┌──────────────┐          ┌──────────────┐  │
│  │ PlantelView  │          │ AvaliacaoForm│          │ RelatorioView│  │
│  │ - Lista      │          │ - 5 Pilares  │          │ - Radar SVG  │  │
│  │ - Filtros    │          │ - Notas 1-10 │          │ - Histórico  │  │
│  │ - Novo Atleta│          │ - Parecer    │          │ - Impressão  │  │
│  └──────────────┘          └──────────────┘          └──────────────┘  │
│         │                          │                         │         │
│         └──────────────────────────┼─────────────────────────┘         │
│                                    ▼                                   │
│                     ┌──────────────────────────┐                       │
│                     │ State Store & Data Engine│                       │
│                     │ - AtletasRepository      │                       │
│                     │ - AvaliacoesRepository   │                       │
│                     │ - LocalStorage Service   │                       │
│                     │ - Backup & Export CSV    │                       │
│                     └──────────────────────────┘                       │
└────────────────────────────────────────────────────────────────────────┘
```

#### Modelo de Dados Principal (TypeScript)

- **Atleta**:
  - `id`: string (UUID)
  - `nome`: string
  - `apelido`?: string
  - `categoria`: 'SUB-15' | 'SUB-16' | 'SUB-17' | string
  - `posicao`: 'Goleiro' | 'Zagueiro' | 'Lateral Direito' | 'Lateral Esquerdo' | 'Volante' | 'Meio-Campista' | 'Ponta' | 'Centroavante'
  - `numeroCamisa`: number
  - `dataNascimento`: string
  - `pernaDominante`: 'Destro' | 'Canhoto' | 'Ambidestro'
  - `status`: 'Ativo' | 'DM' | 'Transição'
  - `fotoUrl`?: string

- **AvaliacaoJogo**:
  - `id`: string
  - `atletaId`: string
  - `dataJogo`: string
  - `adversario`: string
  - `competicao`: string (ex: 'Campeonato Estadual', 'Copa Regional', 'Amistoso')
  - `minutosJogados`: number
  - `notas`:
    - `tecnica`: number (1 a 10)
    - `tatica`: number (1 a 10)
    - `fisica`: number (1 a 10)
    - `mental`: number (1 a 10)
    - `disciplinar`: number (1 a 10)
  - `notaGeral`: number (média calculada)
  - `observacoes`: string (detalhes adicionais sobre o progresso e desenvolvimento)
  - `pontosFortes`: string[]
  - `pontosMelhoria`: string[]

#### Validação e Testes
- Compilação limpa TypeScript sem erros.
- Verificação da responsividade para uso no computador ou no celular à beira do campo de treino.
- Teste de fluxo completo: cadastrar atleta, registrar avaliação com notas e parecer, visualizar radar gráfico e disparar visualização do relatório individual.
