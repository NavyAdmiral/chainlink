import React from 'react'
import {
  createStyles,
  Theme,
  withStyles,
  WithStyles,
} from '@material-ui/core/styles'
import MuiTable from '@material-ui/core/Table'
import TableBody from '@material-ui/core/TableBody'
import TableHead from '@material-ui/core/TableHead'
import TableRow from '@material-ui/core/TableRow'
import MuiTableCell from '@material-ui/core/TableCell'
import { TableCell, Column } from './TableCell'
import TablePagination from '@material-ui/core/TablePagination'
import Paper from '@material-ui/core/Paper'
import { PaginationActions } from './PaginationActions'

interface LoadingProps {
  colCount: number
  msg?: string
}

const Loading = ({ colCount, msg }: LoadingProps) => {
  return (
    <TableRow>
      <MuiTableCell component="th" scope="row" colSpan={colCount}>
        {msg || 'Loading...'}
      </MuiTableCell>
    </TableRow>
  )
}

interface EmptyProps {
  colCount: number
  msg?: string
}

const Empty = ({ colCount, msg }: EmptyProps) => {
  return (
    <TableRow>
      <MuiTableCell component="th" scope="row" colSpan={colCount}>
        {msg || 'No results'}
      </MuiTableCell>
    </TableRow>
  )
}

const styles = (theme: Theme) =>
  createStyles({
    header: {
      backgroundColor: theme.palette.grey['50'],
    },
    table: {
      minHeight: 150,
      whiteSpace: 'nowrap',
    },
    root: {
      width: '100%',
      overflowX: 'auto',
    },
  })

type ChangePageEvent = React.MouseEvent<HTMLButtonElement> | null

interface Props extends WithStyles<typeof styles> {
  headers: string[]
  rowsPerPage: number
  currentPage: number
  onChangePage: (event: ChangePageEvent, page: number) => void
  rows?: Column[][]
  count?: number
  loadingMsg?: string
  emptyMsg?: string
}

const renderRows = ({ headers, rows, loadingMsg, emptyMsg }: Props) => {
  if (!rows) {
    return <Loading colCount={headers.length} msg={loadingMsg} />
  } else if (rows.length === 0) {
    return <Empty colCount={headers.length} msg={emptyMsg} />
  } else {
    return rows.map((r: any[], idx: number) => (
      <TableRow key={idx}>
        {r.map((col: Column, idx: number) => (
          <TableCell key={idx} column={col} />
        ))}
      </TableRow>
    ))
  }
}

const Table = (props: Props) => {
  return (
    <Paper className={props.classes.root}>
      <MuiTable className={props.classes.table}>
        <TableHead>
          <TableRow className={props.classes.header}>
            {props.headers.map((h: string) => (
              <MuiTableCell key={h}>{h}</MuiTableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>{renderRows(props)}</TableBody>
      </MuiTable>
      <TablePagination
        component="div"
        count={props.count || 0}
        rowsPerPageOptions={[]}
        rowsPerPage={props.rowsPerPage}
        page={props.currentPage}
        SelectProps={{
          native: true,
        }}
        onChangePage={props.onChangePage}
        ActionsComponent={PaginationActions}
      />
    </Paper>
  )
}
export const DEFAULT_ROWS_PER_PAGE = 10
export const DEFAULT_CURRENT_PAGE = 0

Table.defaultProps = {
  rowsPerPage: DEFAULT_ROWS_PER_PAGE,
  currentPage: DEFAULT_CURRENT_PAGE,
}

const StyledTable = withStyles(styles)(Table)
export { ChangePageEvent, StyledTable as Table }
