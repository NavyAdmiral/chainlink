import { CardTitle, KeyValueList } from '@chainlink/styleguide'
import {
  createStyles,
  Theme,
  Typography,
  WithStyles,
  withStyles
} from '@material-ui/core'
import Card from '@material-ui/core/Card'
import Grid from '@material-ui/core/Grid'
import { fetchJob, fetchJobRuns } from 'actions'
import { JobSpecRunsOpts } from 'api'
import Content from 'components/Content'
import JobRunsList from 'components/JobRuns/List'
import TaskList from 'components/Jobs/TaskList'
import { AppState } from 'connectors/redux/reducers'
import { IJobRuns, IJobSpec } from 'operator_ui'
import React from 'react'
import { connect } from 'react-redux'
import jobSelector from 'selectors/job'
import jobRunsByJobIdSelector from 'selectors/jobRunsByJobId'
import jobsShowRunCountSelector from 'selectors/jobsShowRunCount'
import { useEffect, useHooks } from 'use-react-hooks'
import { GWEI_PER_TOKEN } from 'utils/constants'
import formatMinPayment from 'utils/formatWeiAsset'
import { formatInitiators } from 'utils/jobSpecInitiators'
import matchRouteAndMapDispatchToProps from 'utils/matchRouteAndMapDispatchToProps'
import RegionalNav from './RegionalNav'
import { IJobRuns, IJobSpec } from '../../../@types/operator_ui'
import { fetchJob, fetchJobEarningActivity, fetchJobRuns } from '../../actions'
import { JobSpecRunsOpts } from '../../api'
import Content from '../../components/Content'
import JobRunsList from '../../components/JobRuns/List'
import TaskList from '../../components/Jobs/TaskList'
import { IState } from '../../connectors/redux/reducers'
import jobSelector from '../../selectors/job'
import jobRunsByJobIdSelector from '../../selectors/jobRunsByJobId'
import jobsShowRunCountSelector from '../../selectors/jobsShowRunCount'
import { GWEI_PER_TOKEN } from '../../utils/constants'
import { formatInitiators } from '../../utils/jobSpecInitiators'
import matchRouteAndMapDispatchToProps from '../../utils/matchRouteAndMapDispatchToProps'
import RegionalNav from './RegionalNav'
import formatMinPayment from '../../utils/formatWeiAsset'
import { ResponsiveContainer, AreaChart, Area } from 'recharts'

const renderJobSpec = (job: IJobSpec, recentRunsCount: number) => {
  const info = {
    runCount: recentRunsCount,
    initiator: formatInitiators(job.initiators),
    minimumPayment: `${formatMinPayment(job.minPayment) || 0} Link`
  }

  return (
    <KeyValueList showHead={false} entries={Object.entries(info)} titleize />
  )
}

const renderTaskRuns = (job: IJobSpec) => (
  <Card>
    <CardTitle divider>Task List</CardTitle>
    <TaskList tasks={job.tasks} />
  </Card>
)

interface IRecentJobRunsProps {
  job: IJobSpec
  recentRuns: IJobRuns
  recentRunsCount: number
  showJobRunsCount: number
}

const totalLinkEarned = (job: IJobSpec) => {
  const zero = '0.000000'
  const unformatted = job.earnings && (job.earnings / GWEI_PER_TOKEN).toString()
  const formatted =
    unformatted &&
    (unformatted.length >= 3 ? unformatted : (unformatted + '.').padEnd(8, '0'))
  return formatted || zero
}

const chartCardStyles = (theme: Theme) =>
  createStyles({
    wrapper: {
      marginLeft: theme.spacing.unit * 3,
      marginTop: theme.spacing.unit * 2,
      marginBottom: theme.spacing.unit * 2
    },
    paymentText: {
      color: theme.palette.secondary.main,
      fontWeight: 450
    },
    earnedText: {
      color: theme.palette.text.secondary,
      fontSize: theme.spacing.unit * 2
    }
  })

interface ChartProps extends WithStyles<typeof chartCardStyles> {
  job: IJobSpec
  earnings?: Array<object>
  fetchEarnings: (id: string) => Promise<any>
}

const data = [
  { pv: 2400 },
  { pv: 2210 },
  { pv: 2290 },
  { pv: 2000 },
  { pv: 2181 },
  { pv: 2500 },
  { pv: 2100 }
]

const Graph = ({ earnings }: { earnings?: Array<object> }) => {
  console.log(earnings)
  return (
    <ResponsiveContainer width="100%" height={120.5}>
      <AreaChart margin={{ top: 0, left: 0, bottom: 0, right: 0 }} data={data}>
        <Area
          type="monotone"
          dataKey="pv"
          stroke="#007bff"
          fill="rgba(0, 123, 255, 0.1)"
          strokeWidth={3}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

const Earnings = withStyles(chartCardStyles)(
  useHooks(({ classes, job, earnings, fetchEarnings }: ChartProps) => {
    const monthAgo = new Date()
    monthAgo.setMonth(monthAgo.getMonth() - 1)
    const isMonthOld = +monthAgo > +new Date(job.createdAt)
    useEffect(() => {
      if (isMonthOld) fetchEarnings(job.id)
    }, [])
    return (
      <Card>
        <Grid item className={classes.wrapper}>
          <Typography className={classes.paymentText} variant="h5">
            Link Payment
          </Typography>
          <Typography className={classes.earnedText}>
            {totalLinkEarned(job)}
          </Typography>
        </Grid>
        {isMonthOld && <Graph earnings={earnings} />}
      </Card>
    )
  })
)

const RecentJobRuns = ({
  job,
  recentRuns,
  recentRunsCount,
  showJobRunsCount
}: IRecentJobRunsProps) => {
  return (
    <Card>
      <CardTitle divider>Recent Job Runs</CardTitle>

      <JobRunsList
        jobSpecId={job.id}
        runs={recentRuns}
        count={recentRunsCount}
        showJobRunsCount={showJobRunsCount}
      />
    </Card>
  )
}

interface IDetailsProps {
  recentRuns: IJobRuns
  recentRunsCount: number
  job?: IJobSpec
  showJobRunsCount: number
  fetchEarnings: (id: string) => Promise<any>
  earnings?: Array<object>
}

const Details = ({
  job,
  earnings,
  recentRuns,
  recentRunsCount,
  showJobRunsCount,
  fetchEarnings
}: IDetailsProps) => {
  if (job) {
    return (
      <Grid container spacing={24}>
        <Grid item xs={8}>
          <RecentJobRuns
            job={job}
            recentRuns={recentRuns}
            recentRunsCount={recentRunsCount}
            showJobRunsCount={showJobRunsCount}
          />
        </Grid>
        <Grid item xs={4}>
          <Grid container direction="column">
            <Grid item xs>
              <Earnings
                job={job}
                earnings={earnings}
                fetchEarnings={fetchEarnings}
              />
            </Grid>
            <Grid item xs>
              {renderTaskRuns(job)}
            </Grid>
            <Grid item xs>
              {renderJobSpec(job, recentRunsCount)}
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    )
  }

  return <div>Fetching...</div>
}

interface IProps {
  jobSpecId: string
  job?: IJobSpec
  earnings?: Array<object>
  recentRuns: IJobRuns
  recentRunsCount: number
  showJobRunsCount: number
  fetchJob: (id: string) => Promise<any>
  fetchJobEarningActivity: (opts: string) => Promise<any>
  fetchJobRuns: (opts: JobSpecRunsOpts) => Promise<any>
}

const DEFAULT_PAGE = 1
const RECENT_RUNS_COUNT = 5

export const Show = useHooks(
  ({
    jobSpecId,
    job,
    earnings,
    fetchJob,
    fetchJobRuns,
    fetchJobEarningActivity,
    recentRunsCount,
    recentRuns = [],
    showJobRunsCount = 2
  }: IProps) => {
    console.log(earnings)
    useEffect(() => {
      document.title = 'Show Job'
      fetchJob(jobSpecId)
      fetchJobRuns({
        jobSpecId: jobSpecId,
        page: DEFAULT_PAGE,
        size: RECENT_RUNS_COUNT
      })
    }, [jobSpecId])
    return (
      <div>
        {/* TODO: Regional nav should handle job = undefined */}
        {job && <RegionalNav jobSpecId={jobSpecId} job={job} />}
        <Content>
          <Details
            job={job}
            recentRuns={recentRuns}
            recentRunsCount={recentRunsCount}
            showJobRunsCount={showJobRunsCount}
            fetchEarnings={fetchJobEarningActivity}
            earnings={earnings}
          />
        </Content>
      </div>
    )
  }
)

interface Match {
  params: {
    jobSpecId: string
  }
}

const mapStateToProps = (
  state: AppState,
  ownProps: { match: Match; showJobRunsCount: number }
) => {
  const jobSpecId = ownProps.match.params.jobSpecId
  const job = jobSelector(state, jobSpecId)
  const recentRuns = jobRunsByJobIdSelector(
    state,
    jobSpecId,
    ownProps.showJobRunsCount
  )
  const recentRunsCount = jobsShowRunCountSelector(state)

  return { jobSpecId, job, recentRuns, recentRunsCount }
}

export const ConnectedShow = connect(
  mapStateToProps,
  matchRouteAndMapDispatchToProps({
    fetchJob,
    fetchJobEarningActivity,
    fetchJobRuns
  })
)(Show)

export default ConnectedShow
