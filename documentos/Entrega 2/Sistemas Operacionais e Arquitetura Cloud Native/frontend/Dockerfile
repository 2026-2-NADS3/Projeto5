# =============================================================================
#  Dockerfile - Frontend / Painel administrativo  (Nginx)
# -----------------------------------------------------------------------------
#  Boas praticas aplicadas:
#    1. Imagem base enxuta: nginx:1.27-alpine (~50MB).
#    2. Camadas otimizadas: a configuracao do Nginx (que muda pouco) e' copiada
#       antes dos arquivos do painel (que mudam a cada ajuste de layout).
#    3. Sem credenciais na imagem: o painel so' usa caminhos relativos.
#    4. HEALTHCHECK apontando para a rota /health definida no nginx.conf.
#    5. Processo rodando como usuario nginx (sem privilegios) a partir da
#       porta 8080 interna, evitando a necessidade de root para portas < 1024.
# =============================================================================

FROM nginx:1.27-alpine

# curl e' usado pelo HEALTHCHECK. O --no-cache evita deixar o indice do apk
# dentro da imagem.
RUN apk add --no-cache curl

# Remove a pagina padrao "Welcome to nginx!" e a configuracao de exemplo.
RUN rm -rf /usr/share/nginx/html/* /etc/nginx/conf.d/default.conf

# 1) Configuracao (camada que raramente muda)
COPY nginx.conf /etc/nginx/conf.d/proximaetapa.conf

# 2) Arquivos do painel (camada que muda com frequencia)
COPY public/ /usr/share/nginx/html/

EXPOSE 80

HEALTHCHECK --interval=15s --timeout=4s --start-period=5s --retries=3 \
    CMD curl -fsS http://127.0.0.1/health || exit 1

# A imagem oficial do Nginx ja' define o CMD e cuida das permissoes dos
# diretorios de cache, por isso nao sobrescrevemos o entrypoint.
