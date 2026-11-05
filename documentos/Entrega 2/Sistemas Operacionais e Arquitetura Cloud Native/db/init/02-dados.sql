-- =============================================================================
--  02-dados.sql - Dados de exemplo (seed) do banco "Proxima Etapa"
-- -----------------------------------------------------------------------------
--  Roda depois do 01-esquema.sql, por ordem alfabetica do nome do arquivo.
--
--  As datas dos encontros usam CURRENT_DATE + intervalo, em vez de datas fixas.
--  Assim o painel sempre mostra "encontros futuros" independentemente de
--  quando o projeto for apresentado.
-- =============================================================================

-- -----------------------------------------------------------------------------
--  ALUNOS
-- -----------------------------------------------------------------------------
INSERT INTO alunos (nome, email, data_nasc, bairro) VALUES
    ('Ana Beatriz Souza',       'ana.souza@email.com',       '2008-03-14', 'Capao Redondo'),
    ('Bruno Carvalho Lima',     'bruno.lima@email.com',      '2007-11-02', 'Itaquera'),
    ('Carla Mendes Ribeiro',    'carla.ribeiro@email.com',   '2009-01-27', 'Brasilandia'),
    ('Diego Santos Alves',      'diego.alves@email.com',     '2008-07-09', 'Cidade Tiradentes'),
    ('Evelyn Rocha Pereira',    'evelyn.pereira@email.com',  '2007-05-21', 'Grajau'),
    ('Felipe Nunes Barbosa',    'felipe.barbosa@email.com',  '2008-09-30', 'Sao Mateus'),
    ('Gabriela Dias Martins',   'gabriela.martins@email.com','2009-02-18', 'Jardim Angela'),
    ('Henrique Costa Silva',    'henrique.silva@email.com',  '2007-12-05', 'Perus');

-- -----------------------------------------------------------------------------
--  CURSOS
-- -----------------------------------------------------------------------------
INSERT INTO cursos (titulo, descricao, carga_horaria, total_encontros, trilha) VALUES
    ('Redacao para o ENEM',    'Estrutura dissertativa-argumentativa e repertorio sociocultural.', 40, 10, 'Linguagens'),
    ('Matematica Basica',      'Revisao de fundamentos: razao, proporcao, funcoes e geometria.',   60, 15, 'Exatas'),
    ('Ciencias da Natureza',   'Biologia, quimica e fisica com foco nas questoes do ENEM.',        48, 12, 'Exatas'),
    ('Ciencias Humanas',       'Historia, geografia, filosofia e atualidades.',                    44, 11, 'Humanas'),
    ('Orientacao de Carreira', 'Autoconhecimento, escolha de curso e mercado de trabalho.',        16,  4, 'Carreira'),
    ('Bolsas e Financiamento', 'PROUNI, FIES, bolsas institucionais e como se inscrever.',         12,  3, 'Carreira');

-- -----------------------------------------------------------------------------
--  MATRICULAS
-- -----------------------------------------------------------------------------
INSERT INTO matriculas (aluno_id, curso_id, data_matricula, status) VALUES
    (1, 1, CURRENT_DATE - 60, 'ativa'),
    (1, 2, CURRENT_DATE - 60, 'ativa'),
    (1, 6, CURRENT_DATE - 40, 'ativa'),
    (2, 1, CURRENT_DATE - 59, 'ativa'),
    (2, 3, CURRENT_DATE - 59, 'ativa'),
    (3, 2, CURRENT_DATE - 58, 'ativa'),
    (3, 4, CURRENT_DATE - 58, 'ativa'),
    (4, 1, CURRENT_DATE - 56, 'trancada'),
    (5, 1, CURRENT_DATE - 55, 'ativa'),
    (5, 2, CURRENT_DATE - 55, 'ativa'),
    (5, 5, CURRENT_DATE - 35, 'concluida'),
    (6, 3, CURRENT_DATE - 52, 'ativa'),
    (7, 4, CURRENT_DATE - 50, 'ativa'),
    (8, 2, CURRENT_DATE - 48, 'ativa');

-- -----------------------------------------------------------------------------
--  ENCONTROS (passados e futuros, relativos a' data de hoje)
-- -----------------------------------------------------------------------------
INSERT INTO encontros (curso_id, titulo, data_hora, online) VALUES
    -- Redacao (curso 1)
    (1, 'Aula 1 - Estrutura da dissertacao',      (CURRENT_DATE - 21) + TIME '19:00', FALSE),
    (1, 'Aula 2 - Tese e argumentacao',           (CURRENT_DATE - 14) + TIME '19:00', FALSE),
    (1, 'Aula 3 - Repertorio sociocultural',      (CURRENT_DATE -  7) + TIME '19:00', FALSE),
    (1, 'Aula 4 - Proposta de intervencao',       (CURRENT_DATE +  2) + TIME '19:00', FALSE),
    (1, 'Aula 5 - Correcao coletiva',             (CURRENT_DATE +  9) + TIME '19:00', FALSE),
    -- Matematica (curso 2)
    (2, 'Aula 1 - Razao e proporcao',             (CURRENT_DATE - 20) + TIME '18:30', FALSE),
    (2, 'Aula 2 - Porcentagem e juros',           (CURRENT_DATE - 13) + TIME '18:30', FALSE),
    (2, 'Aula 3 - Funcao do primeiro grau',       (CURRENT_DATE -  6) + TIME '18:30', FALSE),
    (2, 'Aula 4 - Funcao do segundo grau',        (CURRENT_DATE +  1) + TIME '18:30', FALSE),
    -- Ciencias da Natureza (curso 3)
    (3, 'Aula 1 - Ecologia e meio ambiente',      (CURRENT_DATE - 19) + TIME '19:00', FALSE),
    (3, 'Aula 2 - Estequiometria',                (CURRENT_DATE -  5) + TIME '19:00', FALSE),
    (3, 'Aula 3 - Cinematica',                    (CURRENT_DATE +  3) + TIME '19:00', FALSE),
    -- Ciencias Humanas (curso 4)
    (4, 'Aula 1 - Brasil Republica',              (CURRENT_DATE - 18) + TIME '19:00', FALSE),
    (4, 'Aula 2 - Geopolitica contemporanea',     (CURRENT_DATE +  4) + TIME '19:00', FALSE),
    -- Carreira (cursos 5 e 6)
    (5, 'Encontro unico - Mapa de carreiras',     (CURRENT_DATE - 30) + TIME '10:00', TRUE),
    (6, 'Palestra - Como se inscrever no PROUNI', (CURRENT_DATE +  6) + TIME '19:30', TRUE);

-- -----------------------------------------------------------------------------
--  PRESENCAS
-- -----------------------------------------------------------------------------
INSERT INTO presencas (aluno_id, encontro_id, presente, metodo) VALUES
    (1,  1, TRUE,  'manual'),
    (1,  2, TRUE,  'manual'),
    (1,  3, TRUE,  'qrcode'),
    (1,  6, TRUE,  'manual'),
    (1,  7, FALSE, 'manual'),
    (2,  1, TRUE,  'manual'),
    (2,  2, FALSE, 'manual'),
    (2, 10, TRUE,  'qrcode'),
    (3,  6, TRUE,  'manual'),
    (3,  7, TRUE,  'manual'),
    (3,  8, TRUE,  'qrcode'),
    (3, 13, TRUE,  'manual'),
    (5,  1, TRUE,  'manual'),
    (5,  2, TRUE,  'manual'),
    (5,  3, TRUE,  'qrcode'),
    (5,  6, TRUE,  'manual'),
    (5,  7, TRUE,  'manual'),
    (6, 10, TRUE,  'manual'),
    (6, 11, TRUE,  'qrcode'),
    (7, 13, FALSE, 'manual'),
    (8,  6, TRUE,  'manual'),
    (8,  8, TRUE,  'qrcode');

-- -----------------------------------------------------------------------------
--  CERTIFICADOS
-- -----------------------------------------------------------------------------
INSERT INTO certificados (aluno_id, curso_id, codigo, emitido_em) VALUES
    (5, 5, 'PE-2026-0001-CARR', CURRENT_DATE - 25);

-- -----------------------------------------------------------------------------
--  CONFERENCIA (aparece no log do container do banco)
-- -----------------------------------------------------------------------------
DO $$
DECLARE
    n_alunos INTEGER;
    n_cursos INTEGER;
    n_matriculas INTEGER;
    n_encontros INTEGER;
    n_presencas INTEGER;
BEGIN
    SELECT COUNT(*) INTO n_alunos     FROM alunos;
    SELECT COUNT(*) INTO n_cursos     FROM cursos;
    SELECT COUNT(*) INTO n_matriculas FROM matriculas;
    SELECT COUNT(*) INTO n_encontros  FROM encontros;
    SELECT COUNT(*) INTO n_presencas  FROM presencas;

    RAISE NOTICE 'Carga concluida: % alunos, % cursos, % matriculas, % encontros, % presencas.',
        n_alunos, n_cursos, n_matriculas, n_encontros, n_presencas;
END $$;
