package web_test

import (
	"bytes"
	"encoding/json"
	"testing"

	"github.com/manyminds/api2go/jsonapi"
	"github.com/smartcontractkit/chainlink/internal/cltest"
	"github.com/smartcontractkit/chainlink/store/models"
	"github.com/smartcontractkit/chainlink/store/presenters"
	"github.com/smartcontractkit/chainlink/web"
	"github.com/stretchr/testify/assert"
)

func BenchmarkBridgeTypesController_Index(b *testing.B) {
	app, cleanup := cltest.NewApplication()
	defer cleanup()
	setupJobSpecsControllerIndex(app)

	b.ResetTimer()
	for n := 0; n < b.N; n++ {
		resp, cleanup := cltest.BasicAuthGet(app.Server.URL + "/v2/specs")
		defer cleanup()
		assert.Equal(b, 200, resp.StatusCode, "Response should be successful")
	}
}

func TestBridgeTypesController_Index(t *testing.T) {
	t.Parallel()

	app, cleanup := cltest.NewApplication()
	defer cleanup()

	bt, err := setupBridgeControllerIndex(app)
	assert.NoError(t, err)

	resp, cleanup := cltest.BasicAuthGet(app.Server.URL + "/v2/specs?size=x")
	defer cleanup()
	cltest.AssertServerResponse(t, resp, 422)

	resp, cleanup = cltest.BasicAuthGet(app.Server.URL + "/v2/bridge_types?size=1")
	defer cleanup()
	cltest.AssertServerResponse(t, resp, 200)

	var links jsonapi.Links
	bridges := []models.BridgeType{}

	err = web.ParsePaginatedResponse(cltest.ParseResponseBody(resp), &bridges, &links)
	assert.NoError(t, err)
	assert.NotEmpty(t, links["next"].Href)
	assert.Empty(t, links["prev"].Href)

	assert.Len(t, bridges, 1)
	assert.Equal(t, bt[0].Name, bridges[0].Name, "should have the same Name")
	assert.Equal(t, bt[0].URL.String(), bridges[0].URL.String(), "should have the same URL")
	assert.Equal(t, bt[0].DefaultConfirmations, bridges[0].DefaultConfirmations, "should have the same DefaultConfirmations")

	resp, cleanup = cltest.BasicAuthGet(app.Server.URL + links["next"].Href)
	defer cleanup()
	cltest.AssertServerResponse(t, resp, 200)

	bridges = []models.BridgeType{}
	err = web.ParsePaginatedResponse(cltest.ParseResponseBody(resp), &bridges, &links)
	assert.NoError(t, err)
	assert.Empty(t, links["next"])
	assert.NotEmpty(t, links["prev"])
	assert.Len(t, bridges, 1)
	assert.Equal(t, bt[1].Name, bridges[0].Name, "should have the same Name")
	assert.Equal(t, bt[1].URL.String(), bridges[0].URL.String(), "should have the same URL")
	assert.Equal(t, bt[1].DefaultConfirmations, bridges[0].DefaultConfirmations, "should have the same DefaultConfirmations")
}

func setupBridgeControllerIndex(app *cltest.TestApplication) ([]*models.BridgeType, error) {

	bt1 := &models.BridgeType{
		Name:                 models.NewTaskType("testingbridges1"),
		URL:                  cltest.WebURL("https://testing.com/bridges"),
		DefaultConfirmations: 0,
	}
	err := app.AddAdapter(bt1)
	if err != nil {
		return nil, err
	}

	bt2 := &models.BridgeType{
		Name:                 models.NewTaskType("testingbridges2"),
		URL:                  cltest.WebURL("https://testing.com/tari"),
		DefaultConfirmations: 0,
	}
	err = app.AddAdapter(bt2)

	return []*models.BridgeType{bt1, bt2}, err
}

func TestBridgeTypesController_Create(t *testing.T) {
	t.Parallel()

	app, cleanup := cltest.NewApplication()
	defer cleanup()

	resp, cleanup := cltest.BasicAuthPost(
		app.Server.URL+"/v2/bridge_types",
		"application/json",
		bytes.NewBuffer(cltest.LoadJSON("../internal/fixtures/web/create_random_number_bridge_type.json")),
	)
	defer cleanup()
	cltest.AssertServerResponse(t, resp, 200)
	btName := cltest.ParseCommonJSON(resp.Body).Name

	bt, err := app.Store.FindBridge(btName)
	assert.NoError(t, err)
	assert.Equal(t, "randomnumber", bt.Name.String())
	assert.Equal(t, uint64(10), bt.DefaultConfirmations)
	assert.Equal(t, "https://example.com/randomNumber", bt.URL.String())
}

func TestBridgeController_Show(t *testing.T) {
	t.Parallel()

	app, cleanup := cltest.NewApplication()
	defer cleanup()

	bt := &models.BridgeType{
		Name:                 models.NewTaskType("testingbridges1"),
		URL:                  cltest.WebURL("https://testing.com/bridges"),
		DefaultConfirmations: 0,
	}
	assert.NoError(t, app.AddAdapter(bt))

	resp, cleanup := cltest.BasicAuthGet(app.Server.URL + "/v2/bridge_types/" + bt.Name.String())
	defer cleanup()
	assert.Equal(t, 200, resp.StatusCode, "Response should be successful")

	var respBridge presenters.BridgeType
	json.Unmarshal(cltest.ParseResponseBody(resp), &respBridge)
	assert.Equal(t, respBridge.Name, bt.Name, "should have the same schedule")
	assert.Equal(t, respBridge.URL.String(), bt.URL.String(), "should have the same URL")
	assert.Equal(t, respBridge.DefaultConfirmations, bt.DefaultConfirmations, "should have the same DefaultConfirmations")

	resp, cleanup = cltest.BasicAuthGet(app.Server.URL + "/v2/bridge_types/nosuchbridge")
	defer cleanup()
	assert.Equal(t, 404, resp.StatusCode, "Response should be 404")
}

func TestBridgeController_Destroy(t *testing.T) {
	t.Parallel()

	app, cleanup := cltest.NewApplication()
	defer cleanup()
	resp, cleanup := cltest.BasicAuthDelete(app.Server.URL+"/v2/bridge_types/testingbridges1", "application/json", nil)
	defer cleanup()
	assert.Equal(t, 404, resp.StatusCode, "Response should be 404")

	bt := &models.BridgeType{
		Name:                 models.NewTaskType("testingbridges2"),
		URL:                  cltest.WebURL("https://testing.com/bridges"),
		DefaultConfirmations: 0,
	}
	err := app.AddAdapter(bt)
	assert.NoError(t, err)

	resp, cleanup = cltest.BasicAuthDelete(app.Server.URL+"/v2/bridge_types/"+bt.Name.String(), "application/json", nil)
	defer cleanup()
	assert.Equal(t, 200, resp.StatusCode, "Response should be successful")
	resp, cleanup = cltest.BasicAuthGet(app.Server.URL + "/v2/bridge_types/testingbridges2")
	defer cleanup()
	assert.Equal(t, 404, resp.StatusCode, "Response should be 404")
}

func TestBridgeTypesController_Create_AdapterExistsError(t *testing.T) {
	t.Parallel()

	app, cleanup := cltest.NewApplication()
	defer cleanup()

	resp, cleanup := cltest.BasicAuthPost(
		app.Server.URL+"/v2/bridge_types",
		"application/json",
		bytes.NewBuffer(cltest.LoadJSON("../internal/fixtures/web/existing_core_adapter.json")),
	)
	defer cleanup()
	cltest.AssertServerResponse(t, resp, 400)
}

func TestBridgeTypesController_Create_BindJSONError(t *testing.T) {
	t.Parallel()

	app, cleanup := cltest.NewApplication()
	defer cleanup()

	resp, cleanup := cltest.BasicAuthPost(
		app.Server.URL+"/v2/bridge_types",
		"application/json",
		bytes.NewBufferString("}"),
	)
	defer cleanup()
	cltest.AssertServerResponse(t, resp, 500)
}

func TestBridgeTypesController_Create_DatabaseError(t *testing.T) {
	t.Parallel()

	app, cleanup := cltest.NewApplication()
	defer cleanup()

	resp, cleanup := cltest.BasicAuthPost(
		app.Server.URL+"/v2/bridge_types",
		"application/json",
		bytes.NewBufferString(`{"url":"http://without.a.name"}`),
	)
	defer cleanup()
	cltest.AssertServerResponse(t, resp, 400)
}
