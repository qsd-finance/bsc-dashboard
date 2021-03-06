import React, { useState } from 'react';
import {
  Tabs,
  Button,
  IconArrowUp,
  IconCirclePlus,
  useTheme,
} from '@aragon/ui';
import BigNumber from 'bignumber.js';
import {
  BalanceBlock,
  MaxButton,
  PriceSection,
  TopBorderSection,
} from '../common';
import {
  approve,
  providePool,
  providePoolOptimalOneSided,
} from '../../utils/web3';
import { isPos, toBaseUnitBN, toTokenUnitsBN } from '../../utils/number';
import { QSD, BUSD } from '../../constants/tokens';
import { MAX_UINT256 } from '../../constants/values';
import BigNumberInput from '../common/BigNumberInput';

type ProvideProps = {
  poolAddress: string;
  user: string;
  rewarded: BigNumber;
  pairBalanceQSD: BigNumber;
  pairBalanceBUSD: BigNumber;
  userBUSDBalance: BigNumber;
  userBUSDAllowance: BigNumber;
  status: number;
};

function Provide({
  poolAddress,
  user,
  rewarded,
  pairBalanceQSD,
  pairBalanceBUSD,
  userBUSDBalance,
  userBUSDAllowance,
  status,
}: ProvideProps) {
  const theme = useTheme();
  const isDark = theme._name === 'dark';
  const [useQSD, setUseQSD] = useState(0);
  const [provideAmount, setProvideAmount] = useState(new BigNumber(0));
  const [usdcAmount, setUsdcAmount] = useState(new BigNumber(0));

  const BUSDToQSDRatio = pairBalanceBUSD.isZero()
    ? new BigNumber(1)
    : pairBalanceBUSD.div(pairBalanceQSD);

  const onChangeAmountQSD = (amountQSD) => {
    if (!amountQSD) {
      setProvideAmount(new BigNumber(0));
      setUsdcAmount(new BigNumber(0));
      return;
    }

    const amountQSDBN = new BigNumber(amountQSD);
    setProvideAmount(amountQSDBN);

    const amountQSDBU = toBaseUnitBN(amountQSDBN, QSD.decimals);
    const newAmountBUSD = toTokenUnitsBN(
      amountQSDBU
        .multipliedBy(BUSDToQSDRatio)
        .integerValue(BigNumber.ROUND_FLOOR),
      QSD.decimals
    );
    setUsdcAmount(newAmountBUSD);
  };

  return (
    <TopBorderSection title='Provide'>
      <div
        style={{ width: 'auto', margin: '0 auto' }}
        className={isDark ? 'tabs-container-dark' : undefined}
      >
        <Tabs
          items={['Dual Supply (with BUSD)', 'Single Supply']}
          selected={useQSD}
          onChange={setUseQSD}
        />
      </div>
      {userBUSDAllowance.comparedTo(MAX_UINT256.dividedBy(2)) > 0 || useQSD ? (
        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
          {/* total rewarded */}
          <div style={{ flexBasis: '32%' }}>
            <BalanceBlock asset='Rewarded' balance={rewarded} suffix={'QSD'} />
          </div>
          <div style={{ flexBasis: '35%' }}></div>
          {/* Provide liquidity using Pool rewards */}
          <div style={{ flexBasis: '33%', paddingTop: '2%' }}>
            <div style={{ display: 'flex' }}>
              <div style={{ width: '60%', minWidth: '6em' }}>
                <>
                  <BigNumberInput
                    adornment='QSD'
                    value={provideAmount}
                    setter={onChangeAmountQSD}
                    disabled={status === 1}
                  />
                  {!useQSD && (
                    <PriceSection
                      label='Requires '
                      amt={usdcAmount}
                      symbol=' BUSD'
                    />
                  )}
                  <MaxButton
                    onClick={() => {
                      onChangeAmountQSD(rewarded);
                    }}
                  />
                </>
              </div>
              <div style={{ width: '40%', minWidth: '6em' }}>
                <Button
                  wide
                  icon={<IconArrowUp />}
                  label='Provide'
                  onClick={() => {
                    if (useQSD) {
                      providePoolOptimalOneSided(
                        poolAddress,
                        toBaseUnitBN(provideAmount, QSD.decimals),
                        (hash) => setProvideAmount(new BigNumber(0))
                      );
                    } else {
                      providePool(
                        poolAddress,
                        toBaseUnitBN(provideAmount, QSD.decimals),
                        (hash) => setProvideAmount(new BigNumber(0))
                      );
                    }
                  }}
                  disabled={
                    poolAddress === '' ||
                    status !== 0 ||
                    !isPos(provideAmount) ||
                    provideAmount.isGreaterThan(rewarded)
                  }
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
          {/* total rewarded */}
          <div style={{ flexBasis: '32%' }}>
            <BalanceBlock asset='Rewarded' balance={rewarded} suffix={'QSD'} />
          </div>
          <div style={{ flexBasis: '33%' }}>
            <BalanceBlock
              asset='BUSD Balance'
              balance={userBUSDBalance}
              suffix={'BUSD'}
            />
          </div>
          <div style={{ flexBasis: '2%' }} />
          {/* Approve Pool to spend BUSD */}
          <div style={{ flexBasis: '33%', paddingTop: '2%' }}>
            <Button
              wide
              icon={<IconCirclePlus />}
              label='Approve'
              onClick={() => {
                approve(BUSD.addr, poolAddress);
              }}
              disabled={poolAddress === '' || user === ''}
            />
          </div>
        </div>
      )}
      <div style={{ width: '100%', paddingTop: '2%', textAlign: 'center' }}>
        <span style={{ opacity: 0.5 }}>
          {useQSD
            ? 'Zap your rewards directly'
            : 'Zap your rewards directly to LP by providing more BUSD'}
        </span>
      </div>
    </TopBorderSection>
  );
}

export default Provide;
