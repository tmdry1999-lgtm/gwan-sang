#!/usr/bin/env bash
# Oracle Cloud 무료 ARM 서버(Ubuntu)에 풀이용 Ollama를 상시로 띄운다. → deploy/README.md
#   sudo bash setup-server.sh https://<계정>.github.io
#
# 지키는 것
# - 사진·좌표는 애초에 오지 않는다. 판정 결과 텍스트만 온다.
# - 받은 내용은 저장하지 않는다: 접속 기록(access log)을 남기지 않고, Ollama 출력은 버린다.
# - 밖에서는 HTTPS로 /api/chat, /api/tags 두 개만 열린다. 모델 받기·지우기 같은 관리 기능은 막는다.
# - 허용한 사이트(GitHub Pages)에서 온 브라우저 요청만 받는다. 동시에 1개, 대기 8개까지만.
set -euo pipefail

ALLOW_ORIGIN="${1:?사용법: sudo bash setup-server.sh https://<계정>.github.io}"
MODEL="${MODEL:-gemma3:1b}"
PUBLIC_IP="$(curl -fsS https://api.ipify.org)"
DOMAIN="${DOMAIN:-${PUBLIC_IP//./-}.sslip.io}"

echo "== 주소: https://$DOMAIN  (허용 사이트: $ALLOW_ORIGIN, 모델: $MODEL)"

# 1. Ollama
if ! command -v ollama >/dev/null; then
  curl -fsSL https://ollama.com/install.sh | sh
fi
mkdir -p /etc/systemd/system/ollama.service.d
cat >/etc/systemd/system/ollama.service.d/override.conf <<EOF
[Service]
Environment="OLLAMA_HOST=127.0.0.1:11434"
Environment="OLLAMA_ORIGINS=$ALLOW_ORIGIN"
Environment="OLLAMA_NUM_PARALLEL=1"
Environment="OLLAMA_MAX_QUEUE=8"
Environment="OLLAMA_KEEP_ALIVE=-1"
# 요청 기록을 남기지 않는다. 문제를 볼 때만 잠시 이 두 줄을 지우고 재시작.
StandardOutput=null
StandardError=null
EOF
systemctl daemon-reload
systemctl enable --now ollama
systemctl restart ollama
sleep 3
ollama pull "$MODEL"

# 2. Caddy (HTTPS 인증서 자동)
if ! command -v caddy >/dev/null; then
  apt-get update
  apt-get install -y debian-keyring debian-archive-keyring apt-transport-https curl gnupg
  curl -1sLf https://dl.cloudsmith.io/public/caddy/stable/gpg.key | gpg --dearmor --yes -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt >/etc/apt/sources.list.d/caddy-stable.list
  apt-get update
  apt-get install -y caddy
fi
sed "s|{\$DOMAIN}|$DOMAIN|" "$(dirname "$0")/Caddyfile" >/etc/caddy/Caddyfile
systemctl restart caddy

# 3. 서버 안쪽 방화벽 (Oracle Ubuntu 이미지는 80·443이 막혀 있다)
if ! iptables -C INPUT -p tcp --dport 443 -j ACCEPT 2>/dev/null; then
  iptables -I INPUT 1 -p tcp --dport 80 -j ACCEPT
  iptables -I INPUT 1 -p tcp --dport 443 -j ACCEPT
  command -v netfilter-persistent >/dev/null && netfilter-persistent save
fi

echo
echo "== 끝. 저장소 변수 OLLAMA_URL 에 이 주소를 넣으세요:"
echo "   https://$DOMAIN"
echo "   확인: curl -H 'Origin: $ALLOW_ORIGIN' https://$DOMAIN/api/tags"
