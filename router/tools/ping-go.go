// Contoh endpoint pakai Go. Loader NekoAPI meng-compile file ini sekali
// (go build, di-cache jadi binary), lalu menjalankannya sebagai subprocess
// setiap ada request masuk.
//
// Kontrak wajib:
//   - Input dibaca dari STDIN, berupa JSON: {"query": {...}, "body": {...}}
//   - Output ditulis ke STDOUT, HARUS satu JSON valid (jadi response API)
//   - Exit code 0 = sukses. Exit code != 0 = dianggap error (stderr dibaca
//     sebagai pesan error)
//
// Catatan: endpoint .go hanya berjalan di server yang punya `go` terinstal
// (VPS/PM2). Tidak berjalan di Vercel serverless — otomatis dilewati
// dengan pesan yang jelas kalau runtime Go tidak ada.
//
// Build manual buat testing lokal:
//   go build -o ping-go.bin ping-go.go
//   echo '{"query":{},"body":{}}' | ./ping-go.bin

package main

import (
	"bufio"
	"encoding/json"
	"io"
	"os"
	"runtime"
	"time"
)

type Input struct {
	Query map[string]interface{} `json:"query"`
	Body  map[string]interface{} `json:"body"`
}

type Result struct {
	Runtime   string `json:"runtime"`
	GoVersion string `json:"goVersion"`
	Platform  string `json:"platform"`
	Timestamp string `json:"timestamp"`
}

type Response struct {
	Status bool   `json:"status"`
	Result Result `json:"result"`
}

func main() {
	reader := bufio.NewReader(os.Stdin)
	raw, _ := io.ReadAll(reader)

	var input Input
	_ = json.Unmarshal(raw, &input)

	response := Response{
		Status: true,
		Result: Result{
			Runtime:   "Go",
			GoVersion: runtime.Version(),
			Platform:  runtime.GOOS + "/" + runtime.GOARCH,
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		},
	}

	output, err := json.Marshal(response)
	if err != nil {
		os.Stderr.WriteString(err.Error())
		os.Exit(1)
	}

	os.Stdout.Write(output)
}
