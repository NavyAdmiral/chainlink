package web

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/smartcontractkit/chainlink/core/services"
)

// EarningsController manages account keys
type EarningsController struct {
	App services.Application
}

// // Index returns paginated LINK earnings.
// // Example:
// //  "<application>/earnings"
// func (tc *EarningsController) Index(c *gin.Context, size, page, offset int) {
// 	earnings, count, err := tc.App.GetStore().ListEarnings(offset, size)
// 	pearns := make([]models.LinkEarned, len(earnings))
// 	for i, earning := range earnings {
// 		pearns[i] = models.LinkEarned(earning)
// 	}
// 	paginatedResponse(c, "Earnings", size, page, pearns, count, err)
// }

// Show returns the details of the job spec earning.
// Example:
//  "<application>/earnings/:SpecID"
func (tc *EarningsController) Show(c *gin.Context) {
	ec, err := tc.App.GetStore().LinkEarnedForWeekly(c.Param("SpecID"))
	if err != nil {
		jsonAPIError(c, http.StatusInternalServerError, fmt.Errorf("failed to fetch weekly link earned statistics: %+v", err))
	} else {
		jsonAPIResponse(c, ec, "earnings")
	}
}
