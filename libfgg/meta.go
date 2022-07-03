package libfgg

import (
	"encoding/json"

	"filegogo/libfgg/pool"
)

func (t *Fgg) serverMeta(params []byte) (interface{}, error) {
	meta, err := t.pool.SendMeta()
	t.onPreTran(meta)
	return meta, err
}

func (t *Fgg) clientMeta() error {
	res, _, err := t.call(methodMeta, nil)
	if err != nil {
		return err
	}
	return t.onMeta(res)
}

func (t *Fgg) GetMeta() {
	t.pool.OnFinish = func() {
		t.finish = true
	}
	t.clientMeta()
}

func (t *Fgg) onMeta(data []byte) error {
	meta := &pool.Meta{}
	if err := json.Unmarshal(data, meta); err != nil {
		return err
	}

	t.pool.RecvMeta(meta)

	t.onPreTran(meta)
	return nil
}
