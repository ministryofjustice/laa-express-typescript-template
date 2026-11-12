# MON-5603 – Power Platform - EUCS - Possible OAuth Token Replay Activity

## Classification

Internal

## Summary

Detects non-interactive Power Platform Primary Refresh Token activity exhibiting multiple network or geographic replay indicators.

The rule identifies Power Apps and Power Automate authentication activity that demonstrates combinations of multiple source IP addresses, geographic locations, and autonomous systems for the same identity. This activity may indicate token theft, token replay, session hijacking, shared credentials, or misuse of long-lived OAuth refresh tokens.

## Status

- Status: Implemented
- Enabled in XSIAM: No
- Severity: High
- Owner: Power Platform Squad
- Use Case / Jira Reference: MON-5603
- Threat Model Reference: TM-EUCSPP-007
- XSIAM Rule ID: 680

## Detection Objective

Identify non-interactive Power Platform authentication activity using Primary Refresh Tokens where a single identity exhibits multiple replay indicators across source IP addresses, network providers, or geographic locations.

## Data Sources

- Microsoft Entra ID Sign-In Logs (`msft_azure_ad_raw`)

## Rule Logic

The rule performs the following logic:

1. Monitors Microsoft Entra ID authentication activity.

2. Filters for non-interactive authentication events:
   - `isinteractive = false`

3. Filters for:
   - `incomingtokentype = "primaryRefreshToken"`

4. Restricts activity to Power Platform applications:
   - Applications containing `PowerApps`
   - Applications containing `Power Automate`

5. Normalises:
   - User Object ID
   - Source IP Address
   - Autonomous System Number (ASN)
   - Country
   - City

6. Filters events where:
   - User Object ID is populated
   - Source IP Address is populated
   - ASN is populated
   - Country is populated
   - City is populated

7. Creates a normalised geographic location using:
   - Country
   - City

8. Aggregates activity by:
   - User Object ID

9. Calculates:
   - Sign-in count
   - Distinct IP count
   - Distinct location count
   - Distinct ASN count
   - Source IP addresses
   - Locations
   - Applications
   - Correlation IDs
   - Representative source IP
   - Representative location
   - First observed timestamp
   - Last observed timestamp
   - Elapsed minutes between first and last activity

10. Calculates a replay risk score based on observed indicators:
    - Multiple ASNs and locations
    - Multiple ASNs and source IPs
    - Multiple locations and source IPs
    - Multiple ASNs
    - Multiple locations
    - Multiple source IPs

11. Generates a detection when:
    - `replay_score >= 3`

12. Assigns a detection reason:
    - Multiple ASNs and geographic locations
    - Multiple ASNs and source IP addresses
    - Multiple geographic locations and source IP addresses
    - Multiple token replay indicators detected

13. Outputs:
    - User Object ID
    - Detection Reason
    - Replay Score
    - Sign-In Count
    - Distinct IP Count
    - Distinct Location Count
    - Distinct ASN Count
    - First Seen
    - Last Seen
    - Elapsed Minutes
    - Representative Source IP
    - Representative Location
    - Source IP Addresses
    - Locations
    - Applications
    - Correlation IDs

## Detection Use Cases

- OAuth token replay activity.
- Primary Refresh Token abuse.
- Session hijacking investigations.
- Token theft investigations.
- Shared credential usage.
- Authentication activity originating from multiple autonomous systems.
- Authentication activity originating from multiple geographic locations.
- Authentication activity originating from multiple source IP addresses.
- Abnormal Power Platform non-interactive authentication activity.

## MITRE ATT&CK Mapping

### TA0001 – Initial Access

- T1078 – Valid Accounts

### TA0003 – Persistence

- T1078 – Valid Accounts

### TA0004 – Privilege Escalation

- T1078 – Valid Accounts

### TA0005 – Defense Evasion

- T1078 – Valid Accounts
- T1550 – Use Alternate Authentication Material

### TA0008 – Lateral Movement

- T1550 – Use Alternate Authentication Material

## Limitations / Notes

- The rule relies on Microsoft Entra ID sign-in telemetry contained within the `msft_azure_ad_raw` dataset.
- The rule evaluates only non-interactive authentication events using Primary Refresh Tokens.
- Detection is limited to Power Apps and Power Automate authentication activity.
- Geographic analysis depends on location information being present within Microsoft Entra ID telemetry.
- The rule does not correlate authentication activity with interactive sign-in sessions.
- The rule does not validate device compliance state, Conditional Access outcomes, or MFA activity.
- The rule identifies replay indicators and anomalous authentication patterns but does not independently confirm token theft or token replay.
- Legitimate travel, VPN usage, cloud-hosted integrations, or network provider changes may generate alerts and require investigation.

## Detailed XQL

Detailed query logic is stored in:

`query.xql`
